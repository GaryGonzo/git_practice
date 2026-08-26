import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import getRawBody from "raw-body";

// Stripe needs the raw, unparsed request body to verify the webhook
// signature -- Vercel's default JSON body parsing would break that.
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const signature = req.headers["stripe-signature"];
  // Signature verification kept failing on a byte-for-byte identical
  // secret -- manually draining `req` via .on("data") was silently
  // producing a body that didn't hash-match the original bytes Stripe
  // signed. `raw-body` is what Vercel's own docs use for this exact
  // problem (see vercel.com/docs/headers/request-headers).
  const rawBody = await getRawBody(req);

  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  // Never log the full secret -- length and prefix are enough to tell
  // "empty", "trailing whitespace", and "wrong value entirely" apart
  // without exposing anything sensitive.
  console.log(
    `stripe-webhook: configured secret length=${secret.length}, prefix=${JSON.stringify(secret.slice(0, 10))}, signature header present=${Boolean(signature)}, body bytes=${rawBody.length}`
  );

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature as string, secret);
  } catch (err) {
    console.error("stripe-webhook: signature verification failed", (err as Error).message);
    res.status(400).json({ error: `signature verification failed: ${(err as Error).message}` });
    return;
  }

  console.log(`stripe-webhook: received ${event.type} (${event.id})`);

  // Service-role client: webhooks have no user session to authenticate
  // as, and need to update any member's row based on their Stripe IDs.
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId && session.subscription) {
        const { error, count } = await supabase
          .from("profiles")
          .update(
            {
              stripe_subscription_id: session.subscription as string,
              subscription_status: "active",
            },
            { count: "exact" }
          )
          .eq("id", userId);
        console.log(`stripe-webhook: checkout.session.completed for user ${userId} -- rows updated: ${count}`, error ?? "");
      } else {
        console.log("stripe-webhook: checkout.session.completed missing supabase_user_id or subscription, skipped");
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { error, count } = await supabase
        .from("profiles")
        .update({ subscription_status: subscription.status }, { count: "exact" })
        .eq("stripe_subscription_id", subscription.id);
      console.log(
        `stripe-webhook: ${event.type} for subscription ${subscription.id} (status ${subscription.status}) -- rows updated: ${count}`,
        error ?? ""
      );
      break;
    }
    default:
      break;
  }

  res.status(200).json({ received: true });
}

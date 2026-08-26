import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Stripe needs the raw, unparsed request body to verify the webhook
// signature -- Vercel's default JSON body parsing would break that.
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const signature = req.headers["stripe-signature"];
  const rawBody = await readRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature as string, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    res.status(400).json({ error: `signature verification failed: ${(err as Error).message}` });
    return;
  }

  // Service-role client: webhooks have no user session to authenticate
  // as, and need to update any member's row based on their Stripe IDs.
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (userId && session.subscription) {
        await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: session.subscription as string,
            subscription_status: "active",
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("profiles")
        .update({ subscription_status: subscription.status })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
    default:
      break;
  }

  res.status(200).json({ received: true });
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Maps a locked-in individual_tier value to the Stripe Price ID for it.
// Values live in env vars (not hardcoded) because sandbox and live mode
// have entirely different Price IDs for the same tier.
const PRICE_ID_BY_TIER: Record<string, string | undefined> = {
  tier_799: process.env.STRIPE_PRICE_TIER_799,
  tier_1499: process.env.STRIPE_PRICE_TIER_1499,
  tier_1999: process.env.STRIPE_PRICE_TIER_1999,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!accessToken) {
    res.status(401).json({ error: "missing access token" });
    return;
  }

  // A client authenticated as the caller (not service-role) so RLS and
  // auth.uid() inside assign_individual_tier resolve to the real user --
  // nobody can request a checkout session on someone else's behalf.
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    res.status(401).json({ error: "invalid access token" });
    return;
  }

  const { data: tier, error: tierError } = await supabase.rpc("assign_individual_tier", {
    target_user_id: user.id,
  });
  if (tierError) {
    res.status(500).json({ error: tierError.message });
    return;
  }
  if (!tier || tier === "free") {
    res.status(400).json({ error: "this account doesn't need a paid checkout" });
    return;
  }

  const priceId = PRICE_ID_BY_TIER[tier];
  if (!priceId) {
    res.status(500).json({ error: `no Stripe price configured for tier ${tier}` });
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const origin = (req.headers.origin as string) || "https://golfable.co";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/app/profile?checkout=success`,
    cancel_url: `${origin}/app/profile?checkout=canceled`,
    metadata: { supabase_user_id: user.id },
  });

  res.status(200).json({ url: session.url });
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// A member joining a studio (via /my-studio/:slug) is now covered by the
// studio's flat fee -- if they already had an active individual
// subscription, it gets canceled here so they stop paying immediately.
// profiles.studio_id is service-role-only to write (see
// 0026_studio_lifecycle.sql), so this has to go through the server rather
// than a direct client-side update.
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

  const { studioId } = req.body as { studioId?: string };
  if (!studioId) {
    res.status(400).json({ error: "studioId is required" });
    return;
  }

  const userScoped = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await userScoped.auth.getUser(accessToken);
  if (userError || !user) {
    res.status(401).json({ error: "invalid access token" });
    return;
  }

  const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: studio, error: studioError } = await service
    .from("studios")
    .select("id, name, canceled_at")
    .eq("id", studioId)
    .maybeSingle();
  if (studioError) {
    res.status(500).json({ error: studioError.message });
    return;
  }
  if (!studio) {
    res.status(404).json({ error: "studio not found" });
    return;
  }
  if (studio.canceled_at) {
    res.status(400).json({ error: "this studio is no longer active" });
    return;
  }

  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();
  if (profileError) {
    res.status(500).json({ error: profileError.message });
    return;
  }

  const subscriptionId = profile?.stripe_subscription_id as string | null | undefined;
  if (subscriptionId && profile?.subscription_status !== "canceled") {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch (err) {
      // Already canceled on Stripe's side (e.g. a stale local status) --
      // fine to proceed, the studio join itself still needs to happen.
      if (!(err instanceof Stripe.errors.StripeInvalidRequestError)) throw err;
    }
  }

  const { error: joinError } = await service.from("profiles").update({ studio_id: studio.id }).eq("id", user.id);
  if (joinError) {
    res.status(500).json({ error: joinError.message });
    return;
  }

  res.status(200).json({ studioId: studio.id, studioName: studio.name });
}

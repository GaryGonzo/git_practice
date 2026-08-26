import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Site-admin creates a studio and its owner joins it in the same step --
// unlike a member joining via /my-studio/:slug, the owner never clicks
// their own invite link, so this is the only place that sets studio_id
// for them. Also cancels the owner's individual subscription if they
// already had one, same as a regular member joining (see join-studio.ts).
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

  const { name, ownerUserId } = req.body as { name?: string; ownerUserId?: string };
  if (!name?.trim() || !ownerUserId) {
    res.status(400).json({ error: "a studio name and owner are both required" });
    return;
  }

  const userScoped = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await userScoped.auth.getUser(accessToken);
  if (callerError || !caller) {
    res.status(401).json({ error: "invalid access token" });
    return;
  }

  const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: callerProfile } = await service.from("profiles").select("is_admin").eq("id", caller.id).single();
  if (!callerProfile?.is_admin) {
    res.status(403).json({ error: "admin only" });
    return;
  }

  const base = slugify(name) || "studio";
  let studio: { id: string; name: string; slug: string; owner_user_id: string; created_at: string } | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data, error } = await service
      .from("studios")
      .insert({ name: name.trim(), slug, owner_user_id: ownerUserId })
      .select("*")
      .single();
    if (!error && data) {
      studio = data;
      break;
    }
    if (error && error.code !== "23505") {
      res.status(500).json({ error: error.message });
      return;
    }
  }
  if (!studio) {
    res.status(500).json({ error: "couldn't generate a unique studio URL -- try a different name" });
    return;
  }

  const { data: ownerProfile, error: ownerError } = await service
    .from("profiles")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", ownerUserId)
    .single();
  if (ownerError) {
    res.status(500).json({ error: ownerError.message });
    return;
  }

  const subscriptionId = ownerProfile?.stripe_subscription_id as string | null | undefined;
  if (subscriptionId && ownerProfile?.subscription_status !== "canceled") {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch (err) {
      if (!(err instanceof Stripe.errors.StripeInvalidRequestError)) throw err;
    }
  }

  const { error: joinError } = await service.from("profiles").update({ studio_id: studio.id }).eq("id", ownerUserId);
  if (joinError) {
    res.status(500).json({ error: joinError.message });
    return;
  }

  res.status(200).json({
    id: studio.id,
    name: studio.name,
    slug: studio.slug,
    ownerUserId: studio.owner_user_id,
    createdAt: studio.created_at,
  });
}

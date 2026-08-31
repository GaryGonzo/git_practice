import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Admin-only: approve (sets the underlying thread/reply to visible) or
// reject (sets it to removed) a flagged post. Same pattern as
// create-studio.ts's admin check -- profiles.is_admin is verified
// server-side, not trusted from the client.
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

  const { flagId, decision } = req.body as { flagId?: string; decision?: "approved" | "rejected" };
  if (!flagId || (decision !== "approved" && decision !== "rejected")) {
    res.status(400).json({ error: "flagId and a decision of 'approved' or 'rejected' are required" });
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

  const { data: flag, error: flagError } = await service
    .from("forum_moderation_flags")
    .select("id, content_type, content_id, status")
    .eq("id", flagId)
    .maybeSingle();
  if (flagError) {
    res.status(500).json({ error: flagError.message });
    return;
  }
  if (!flag) {
    res.status(404).json({ error: "flag not found" });
    return;
  }
  if (flag.status !== "pending") {
    res.status(400).json({ error: "this flag has already been reviewed" });
    return;
  }

  const table = flag.content_type === "thread" ? "forum_threads" : "forum_replies";
  const contentStatus = decision === "approved" ? "visible" : "removed";

  const { error: contentError } = await service.from(table).update({ status: contentStatus }).eq("id", flag.content_id);
  if (contentError) {
    res.status(500).json({ error: contentError.message });
    return;
  }

  const { error: updateFlagError } = await service
    .from("forum_moderation_flags")
    .update({ status: decision, reviewed_by: caller.id, reviewed_at: new Date().toISOString() })
    .eq("id", flagId);
  if (updateFlagError) {
    res.status(500).json({ error: updateFlagError.message });
    return;
  }

  res.status(200).json({ flagId, decision });
}

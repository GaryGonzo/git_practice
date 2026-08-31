import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { moderateContent } from "./_lib/forumModeration.js";

// Same reasoning as forum-create-thread.ts -- status must come from a
// server-side moderation check, so replies are never inserted directly by
// the client.
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

  const { threadId, body } = req.body as { threadId?: string; body?: string };
  const trimmedBody = body?.trim() ?? "";
  if (!threadId || !trimmedBody) {
    res.status(400).json({ error: "threadId and body are both required" });
    return;
  }
  if (trimmedBody.length > 5000) {
    res.status(400).json({ error: "body must be 5000 characters or fewer" });
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

  // Only reply to a thread that's actually visible -- a pending/removed
  // thread shouldn't be discoverable to reply to in the first place.
  const { data: thread } = await service
    .from("forum_threads")
    .select("id, status")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || thread.status !== "visible") {
    res.status(404).json({ error: "thread not found" });
    return;
  }

  const moderation = await moderateContent(trimmedBody);
  const status = moderation.flagged ? "pending_review" : "visible";

  const { data: reply, error: replyError } = await service
    .from("forum_replies")
    .insert({ thread_id: threadId, author_id: user.id, body: trimmedBody, status })
    .select("id, status, created_at")
    .single();
  if (replyError) {
    res.status(500).json({ error: replyError.message });
    return;
  }

  if (moderation.flagged) {
    const { error: flagError } = await service.from("forum_moderation_flags").insert({
      content_type: "reply",
      content_id: reply.id,
      author_id: user.id,
      reason: moderation.reason,
      matched_terms: moderation.matchedTerms,
      ai_categories: moderation.aiCategories,
      ai_reasoning: moderation.aiReasoning,
    });
    if (flagError) {
      res.status(500).json({ error: flagError.message });
      return;
    }
  }

  res.status(200).json({ id: reply.id, status: reply.status, createdAt: reply.created_at });
}

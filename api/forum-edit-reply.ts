import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { moderateContent } from "./_lib/forumModeration.js";

// Same reasoning as forum-edit-thread.ts.
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

  const { replyId, body } = req.body as { replyId?: string; body?: string };
  const trimmedBody = body?.trim() ?? "";
  if (!replyId || !trimmedBody) {
    res.status(400).json({ error: "replyId and body are both required" });
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

  const { data: reply } = await service
    .from("forum_replies")
    .select("id, author_id, status")
    .eq("id", replyId)
    .maybeSingle();
  if (!reply) {
    res.status(404).json({ error: "reply not found" });
    return;
  }
  if (reply.author_id !== user.id) {
    res.status(403).json({ error: "you can only edit your own posts" });
    return;
  }
  if (reply.status === "removed") {
    res.status(400).json({ error: "this reply was removed and can't be edited" });
    return;
  }

  const moderation = await moderateContent(trimmedBody);
  const status = moderation.flagged ? "pending_review" : "visible";
  const editedAt = new Date().toISOString();

  const { error: updateError } = await service
    .from("forum_replies")
    .update({ body: trimmedBody, status, edited_at: editedAt })
    .eq("id", replyId);
  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  if (moderation.flagged) {
    const { error: flagError } = await service.from("forum_moderation_flags").insert({
      content_type: "reply",
      content_id: replyId,
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

  res.status(200).json({ id: replyId, status, editedAt });
}

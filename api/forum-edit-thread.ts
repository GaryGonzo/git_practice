import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { moderateContent } from "./_lib/forumModeration.js";

// Same reasoning as forum-create-thread.ts -- status must come from a
// server-side moderation check, so an edit is never a direct client
// update either. Re-runs moderation on the edited text (an edit is a
// fresh chance to get flagged or cleared, same as a new post) and
// re-verifies the caller actually owns this thread.
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

  const { threadId, title, body } = req.body as { threadId?: string; title?: string; body?: string };
  const trimmedTitle = title?.trim() ?? "";
  const trimmedBody = body?.trim() ?? "";
  if (!threadId || !trimmedTitle || !trimmedBody) {
    res.status(400).json({ error: "threadId, title, and body are all required" });
    return;
  }
  if (trimmedTitle.length > 150) {
    res.status(400).json({ error: "title must be 150 characters or fewer" });
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

  const { data: thread } = await service
    .from("forum_threads")
    .select("id, author_id, status")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) {
    res.status(404).json({ error: "thread not found" });
    return;
  }
  if (thread.author_id !== user.id) {
    res.status(403).json({ error: "you can only edit your own posts" });
    return;
  }
  if (thread.status === "removed") {
    res.status(400).json({ error: "this post was removed and can't be edited" });
    return;
  }

  const moderation = await moderateContent(`${trimmedTitle}\n\n${trimmedBody}`);
  const status = moderation.flagged ? "pending_review" : "visible";
  const editedAt = new Date().toISOString();

  const { error: updateError } = await service
    .from("forum_threads")
    .update({ title: trimmedTitle, body: trimmedBody, status, edited_at: editedAt })
    .eq("id", threadId);
  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  if (moderation.flagged) {
    const { error: flagError } = await service.from("forum_moderation_flags").insert({
      content_type: "thread",
      content_id: threadId,
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

  res.status(200).json({ id: threadId, status, editedAt });
}

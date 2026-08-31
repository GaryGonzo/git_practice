import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { moderateContent } from "./_lib/forumModeration.js";

// Thread creation always goes through here rather than a direct client
// insert -- see 0034_forum.sql -- because the row's status has to come from
// a server-side moderation check the client must not be able to set itself.
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

  const { categoryId, title, body } = req.body as { categoryId?: string; title?: string; body?: string };
  const trimmedTitle = title?.trim() ?? "";
  const trimmedBody = body?.trim() ?? "";
  if (!categoryId || !trimmedTitle || !trimmedBody) {
    res.status(400).json({ error: "categoryId, title, and body are all required" });
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

  const { data: category } = await service.from("forum_categories").select("id").eq("id", categoryId).maybeSingle();
  if (!category) {
    res.status(404).json({ error: "category not found" });
    return;
  }

  const moderation = await moderateContent(`${trimmedTitle}\n\n${trimmedBody}`);
  const status = moderation.flagged ? "pending_review" : "visible";

  const { data: thread, error: threadError } = await service
    .from("forum_threads")
    .insert({ category_id: categoryId, author_id: user.id, title: trimmedTitle, body: trimmedBody, status })
    .select("id, status, created_at")
    .single();
  if (threadError) {
    res.status(500).json({ error: threadError.message });
    return;
  }

  if (moderation.flagged) {
    const { error: flagError } = await service.from("forum_moderation_flags").insert({
      content_type: "thread",
      content_id: thread.id,
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

  res.status(200).json({ id: thread.id, status: thread.status, createdAt: thread.created_at });
}

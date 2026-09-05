-- Editing a thread or reply after it's posted. Same reasoning as creation
-- (0034_forum.sql) -- no client update policy on forum_threads/
-- forum_replies, so edits go through api/forum-edit-thread.ts and
-- api/forum-edit-reply.ts, which re-run the same moderation check as a
-- fresh post and re-verify the caller is the original author.

alter table forum_threads add column if not exists edited_at timestamptz;
alter table forum_replies add column if not exists edited_at timestamptz;

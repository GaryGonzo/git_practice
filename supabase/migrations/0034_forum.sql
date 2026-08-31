-- Member forum: categories, threads, replies, and a moderation-flag queue.
--
-- Every thread/reply write goes through a server endpoint (never a direct
-- client insert) because a post's status has to be decided by a server-side
-- moderation check -- a client that could insert status='visible' itself
-- would bypass moderation entirely. So there are deliberately no client
-- insert/update/delete policies on forum_threads/forum_replies/
-- forum_moderation_flags below; those tables are written only via the
-- service role from api/forum-*.ts.

create table forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table forum_categories enable row level security;

create policy "categories are publicly readable"
  on forum_categories for select
  using (true);

insert into forum_categories (slug, name, description, sort_order) values
  ('general', 'General Chat', 'Anything golf -- rounds, gear, or just saying hi.', 0),
  ('qa', 'Questions & Answers', 'Ask the community anything about Golfable or your game.', 1),
  ('feedback', 'Feedback & Ideas', 'Suggest a drill, report a bug, or tell us what to build next.', 2);

create type forum_content_status as enum ('visible', 'pending_review', 'removed');

create table forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references forum_categories(id),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  body text not null check (char_length(body) between 1 and 5000),
  status forum_content_status not null default 'pending_review',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table forum_threads enable row level security;
create index forum_threads_category_id_idx on forum_threads(category_id);

-- A thread is visible to everyone once approved; before that, only its
-- author (so they can see it's pending) and admins can see it.
create policy "visible threads are public, authors and admins see their own"
  on forum_threads for select
  using (
    status = 'visible'
    or author_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

create table forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references forum_threads(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  status forum_content_status not null default 'pending_review',
  created_at timestamptz not null default now()
);

alter table forum_replies enable row level security;
create index forum_replies_thread_id_idx on forum_replies(thread_id);

create policy "visible replies are public, authors and admins see their own"
  on forum_replies for select
  using (
    status = 'visible'
    or author_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin)
  );

-- One row per thread/reply that the word-list or AI check flagged, so
-- admins have a queue of exactly what needs a human look rather than
-- having to scan every post.
create table forum_moderation_flags (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('thread', 'reply')),
  content_id uuid not null,
  author_id uuid not null references profiles(id) on delete cascade,
  reason text not null check (reason in ('word_list', 'ai_flagged', 'both')),
  matched_terms text[] not null default '{}',
  ai_categories text[] not null default '{}',
  ai_reasoning text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table forum_moderation_flags enable row level security;
create index forum_moderation_flags_status_idx on forum_moderation_flags(status);

create policy "admins can see moderation flags"
  on forum_moderation_flags for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- Reply counts and last-activity, computed rather than denormalized so they
-- can't drift from the underlying rows. security_invoker so a regular
-- member's own RLS (visible-only, plus their own pending posts) applies --
-- NOT the view owner's, which would bypass it (see 0032's advisor fix for
-- why this matters).
create view forum_thread_summary
  with (security_invoker = true) as
select
  t.id,
  t.category_id,
  t.title,
  t.status,
  t.pinned,
  t.created_at,
  t.author_id,
  p.first_name as author_first_name,
  p.last_name as author_last_name,
  count(r.id) filter (where r.status = 'visible') as reply_count,
  greatest(t.created_at, max(r.created_at) filter (where r.status = 'visible')) as last_activity_at
from forum_threads t
join profiles p on p.id = t.author_id
left join forum_replies r on r.thread_id = t.id
group by t.id, p.first_name, p.last_name;

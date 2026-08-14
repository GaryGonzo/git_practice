-- Challenge Mode: invite friends on the range to compete head-to-head on a
-- chosen drill. No friends graph needed -- a challenge gets a short,
-- shareable join code (texted, said out loud, whatever), and anyone who
-- enters it joins as a participant. "Completed" isn't a stored status; it's
-- just true once every participant has a non-null score, computed
-- client-side, so there's no separate state to keep in sync.

create table challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles (id) on delete cascade,
  drill_id text not null references drills (id),
  code text not null unique,
  wager text,
  note text,
  created_at timestamptz not null default now()
);

create table challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  score smallint,
  joined_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique (challenge_id, user_id)
);

create index challenge_participants_challenge_id_idx on challenge_participants (challenge_id);

alter table challenges enable row level security;
alter table challenge_participants enable row level security;

-- Same "publicly readable, write your own row" shape as scores/profiles --
-- a challenge and its standings need to be visible to everyone competing
-- in it (and to whoever's about to join via the code), not just the creator.
create policy "challenges are publicly readable"
  on challenges for select
  using (true);

create policy "users can create their own challenges"
  on challenges for insert
  with check (auth.uid() = creator_id);

create policy "challenge participants are publicly readable"
  on challenge_participants for select
  using (true);

create policy "users can join a challenge as themselves"
  on challenge_participants for insert
  with check (auth.uid() = user_id);

create policy "users can update their own participant row"
  on challenge_participants for update
  using (auth.uid() = user_id);

-- Opt both tables into Supabase Realtime so the challenge screen can show
-- live scores as everyone submits, instead of requiring a manual refresh.
alter publication supabase_realtime add table challenges;
alter publication supabase_realtime add table challenge_participants;

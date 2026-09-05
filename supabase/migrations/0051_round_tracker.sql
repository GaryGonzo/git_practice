-- In-round tracker: a live scorecard for a full round on the course
-- (freeform -- no course database, par is entered per hole as you play),
-- saved afterward so score, fairways/greens hit, putts, and penalties
-- build a history over time. Purely personal data (unlike scores, which
-- are public for the leaderboard), so both tables are private to their
-- owner -- same insert/update/delete-your-own shape as 0001's scores
-- table, but select is owner-only too.

create table rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  hole_count smallint not null check (hole_count in (9, 18)),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index rounds_user_id_idx on rounds(user_id);

alter table rounds enable row level security;

create policy "users manage their own rounds"
  on rounds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- One row per hole played. user_id is denormalized from rounds so RLS
-- doesn't need a join -- same shape, one row per hole.
create table round_holes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  hole_number smallint not null check (hole_number between 1 and 18),
  par smallint not null check (par between 3 and 6),
  score smallint check (score is null or score >= 1),
  fairway_hit boolean,
  green_in_regulation boolean,
  putts smallint check (putts is null or putts >= 0),
  penalty_strokes smallint not null default 0 check (penalty_strokes >= 0),
  unique (round_id, hole_number)
);

create index round_holes_round_id_idx on round_holes(round_id);

alter table round_holes enable row level security;

create policy "users manage their own round holes"
  on round_holes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

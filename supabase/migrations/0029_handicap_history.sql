-- Tracks a player's self-reported handicap (or, lacking one, their average
-- score on a par-72 course) over time, so we can show game/score
-- improvement trends. One row per update rather than a single column on
-- profiles -- the history itself is the point.

create table handicap_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  handicap_index numeric(4,1),
  avg_score_par72 smallint,
  recorded_at timestamptz not null default now(),
  constraint handicap_or_avg_score check (handicap_index is not null or avg_score_par72 is not null)
);

create index handicap_history_user_id_idx on handicap_history (user_id, recorded_at desc);

alter table handicap_history enable row level security;

create policy "users can view their own handicap history"
  on handicap_history for select
  using (auth.uid() = user_id);

create policy "users can log their own handicap"
  on handicap_history for insert
  with check (auth.uid() = user_id);

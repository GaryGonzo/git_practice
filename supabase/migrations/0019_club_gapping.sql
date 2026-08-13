-- Club Gapping Log: lets a user track carry distance per club from range
-- sessions, so the Training Tools screen can show average distance per
-- club and surface any gaps in the bag. Private to the logging user --
-- there's no leaderboard or social angle here, just a personal log.

create table club_distances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  club text not null,
  distance_yards smallint not null check (distance_yards > 0 and distance_yards < 400),
  created_at timestamptz not null default now()
);

create index club_distances_user_id_idx on club_distances (user_id);

alter table club_distances enable row level security;

create policy "users can manage their own club distances"
  on club_distances for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

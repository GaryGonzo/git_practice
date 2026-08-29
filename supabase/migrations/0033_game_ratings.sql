-- My Game: a player's own anecdotal 1-10 read on where each part of their
-- game stands right now. Deliberately not historical (unlike
-- handicap_history) -- just a current snapshot, freely overwritten, that
-- feeds the "Recommended for You" filter on Choose Your Own Golfable.
-- Private to the player -- unlike scores/ratings there's no community use
-- for someone else's self-assessment, so no public-read policy here.

create table game_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  category skill_category not null,
  rating smallint not null check (rating between 1 and 10),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table game_ratings enable row level security;

create policy "users can view their own game ratings"
  on game_ratings for select
  using (auth.uid() = user_id);

create policy "users can set their own game ratings"
  on game_ratings for insert
  with check (auth.uid() = user_id);

create policy "users can update their own game ratings"
  on game_ratings for update
  using (auth.uid() = user_id);

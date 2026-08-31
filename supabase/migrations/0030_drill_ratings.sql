-- Golfable Games ratings: after a member's first-ever completion of a
-- drill, they rate it 1-5. Publicly readable (like scores/challenges)
-- since "Community Favorites" needs everyone's ratings, not just your own.
-- A view does the avg/count aggregation once instead of every caller
-- re-deriving it client-side.

create table drill_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  drill_id text not null references drills (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, drill_id)
);

create index drill_ratings_drill_id_idx on drill_ratings (drill_id);

alter table drill_ratings enable row level security;

create policy "ratings are publicly readable"
  on drill_ratings for select
  using (true);

create policy "users can rate a drill as themselves"
  on drill_ratings for insert
  with check (auth.uid() = user_id);

create policy "users can update their own rating"
  on drill_ratings for update
  using (auth.uid() = user_id);

create view drill_rating_summary as
  select drill_id, round(avg(rating)::numeric, 2) as avg_rating, count(*) as rating_count
  from drill_ratings
  group by drill_id;

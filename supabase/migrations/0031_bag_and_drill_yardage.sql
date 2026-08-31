-- My Bag: a player's typical yardage per club (everything but the
-- putter), used to suggest a club when a Golfable calls for a specific
-- yardage. One row per club rather than a fixed set of columns, so the
-- app's club list can grow without another migration.
--
-- Also adds drills.target_yardage, which nothing currently sets -- most
-- existing drills aren't yardage-based, so this stays null until drill
-- content specifies one. The suggestion UI already has to handle "no bag
-- set" gracefully; "drill has no yardage" degrades the same way.
--
-- Piggybacking a real bug fix here: drills.video_url doesn't exist yet,
-- but the app (DrillRow/toDrill in golfableApi.ts) already selects and
-- maps it -- it's just always come back undefined. Since this migration
-- is already altering `drills`, add the column now instead of leaving it
-- broken.

alter table drills add column target_yardage smallint;
alter table drills add column video_url text;

create table bag_clubs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  club text not null,
  yardage smallint,
  unique (user_id, club)
);

alter table bag_clubs enable row level security;

create policy "users can view their own bag"
  on bag_clubs for select
  using (auth.uid() = user_id);

create policy "users can add to their own bag"
  on bag_clubs for insert
  with check (auth.uid() = user_id);

create policy "users can update their own bag"
  on bag_clubs for update
  using (auth.uid() = user_id);

create policy "users can remove their own bag entries"
  on bag_clubs for delete
  using (auth.uid() = user_id);

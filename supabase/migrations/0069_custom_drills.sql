-- 0069: member-created ("custom") drills, private or shared with the community.
--
-- A member can write up their own drill -- name, club category, setup, rules,
-- scoring, max score, score direction, optional goal -- and play it like any
-- other drill. Custom drills live in the same `drills` table (created_by set
-- to the author), so everything keyed on drill_id already works: score
-- logging, personal best, history, leaderboards, ratings, the weekly goal and
-- Golfable Score.
--
-- visibility:
--   'private'   -- only the author sees it
--   'community' -- listed for every member under Community Drills
--
-- All writes go through /api/custom-drill (service role), never a direct
-- client insert/update: anything going public has to pass the server-side
-- word filter first, and the client must not be able to skip that. So there
-- are no client write policies here -- only read.
--
-- Removal is a soft delete (archived_at): it leaves listings, but anyone who
-- already logged a score on it keeps it in their history (see drills_read).
--
-- Idempotent. Rollback: supabase/rollbacks/0069_custom_drills_rollback.sql

alter table public.drills
  add column if not exists created_by uuid references public.profiles (id) on delete cascade,
  add column if not exists visibility text not null default 'private',
  add column if not exists archived_at timestamptz;

alter table public.drills drop constraint if exists drills_visibility_check;
alter table public.drills add constraint drills_visibility_check check (visibility in ('private', 'community'));

create index if not exists drills_created_by_idx on public.drills (created_by) where created_by is not null;
create index if not exists drills_community_idx on public.drills (created_at desc)
  where created_by is not null and visibility = 'community' and archived_at is null;

-- Guard rails on member-written rows. Official rows (created_by null) are
-- exempt so seed migrations aren't constrained by these.
alter table public.drills drop constraint if exists drills_custom_shape_check;
alter table public.drills add constraint drills_custom_shape_check check (
  created_by is null or (
    id like 'custom-%'
    and char_length(name) between 1 and 60
    and char_length(setup_description) between 1 and 1000
    and char_length(rules_description) between 1 and 1500
    and cardinality(setup_equipment) <= 12
    and cardinality(rules_scoring) between 1 and 12
    and max_score between 1 and 999
    and video_url is null
    and target_yardage is null
  )
);

-- A drill's author and id never change once created.
create or replace function public.drills_lock_created_by()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.created_by is distinct from old.created_by or new.id is distinct from old.id then
    raise exception 'drill author and id cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists drills_lock_created_by on public.drills;
create trigger drills_lock_created_by
  before update on public.drills
  for each row execute function public.drills_lock_created_by();

-- Read: official drills, your own, anything shared with the community, and
-- any drill you've already logged a score on (so history survives the
-- author removing it or switching it back to private).
drop policy if exists "drills are publicly readable" on public.drills;
drop policy if exists drills_read on public.drills;
create policy drills_read on public.drills
  for select
  using (
    created_by is null
    or created_by = auth.uid()
    or visibility = 'community'
    or exists (select 1 from public.scores s where s.drill_id = drills.id and s.user_id = auth.uid())
  );

drop policy if exists drills_insert_own on public.drills;
drop policy if exists drills_update_own on public.drills;

-- Challenges and the daily calendar stay official-drill only.
create or replace function public.reject_custom_drill_ref()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.drills d where d.id = new.drill_id and d.created_by is not null) then
    raise exception 'custom drills cannot be used here';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_custom_drill_ref() from public;

drop trigger if exists challenges_no_custom_drill on public.challenges;
create trigger challenges_no_custom_drill
  before insert or update of drill_id on public.challenges
  for each row execute function public.reject_custom_drill_ref();

drop trigger if exists daily_golfable_no_custom_drill on public.daily_golfable;
create trigger daily_golfable_no_custom_drill
  before insert or update of drill_id on public.daily_golfable
  for each row execute function public.reject_custom_drill_ref();

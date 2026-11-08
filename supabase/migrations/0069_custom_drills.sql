-- 0069: member-created ("custom") drills.
--
-- A member can write up their own drill -- name, club category, setup, rules,
-- scoring, max score, score direction, optional goal -- and play it from the
-- Library like any other drill. Custom drills live in the same `drills`
-- table (created_by set to the author) so everything keyed on drill_id
-- already works for them: score logging, personal best, last attempt,
-- history on Progress, and the weekly goal (which counts distinct days with
-- any score -- see getSessionsThisWeek).
--
-- Visibility: official drills (created_by is null) stay public. A custom
-- drill is only visible to its author -- nobody else's Library, challenge
-- picker or leaderboard ever sees it.
--
-- Removal is a soft delete (archived_at) so the scores already logged
-- against a custom drill, and the days they counted toward, stay intact.
--
-- Golfable Score excludes custom drills client-side (a member-written max
-- score isn't calibrated against the official rubric).
--
-- Idempotent. Rollback: supabase/rollbacks/0069_custom_drills_rollback.sql

alter table public.drills
  add column if not exists created_by uuid references public.profiles (id) on delete cascade,
  add column if not exists archived_at timestamptz;

create index if not exists drills_created_by_idx on public.drills (created_by) where created_by is not null;

-- Guard rails on member-written rows. Official rows (created_by null) are
-- exempt so existing/future seed migrations aren't constrained by these.
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

-- Official drills can never be given an author after the fact, and a custom
-- drill can't change hands (or be "promoted" to official by its author).
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

-- RLS: replace the blanket public-read policy.
drop policy if exists "drills are publicly readable" on public.drills;
drop policy if exists drills_read on public.drills;
create policy drills_read on public.drills
  for select
  using (created_by is null or created_by = auth.uid());

drop policy if exists drills_insert_own on public.drills;
create policy drills_insert_own on public.drills
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists drills_update_own on public.drills;
create policy drills_update_own on public.drills
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- No delete policy on purpose: removal is archived_at, which keeps scores.

-- Keep a custom drill out of shared features even by id. Challenges are
-- multi-player and the daily calendar is everyone's -- neither should ever
-- point at someone's private drill.
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

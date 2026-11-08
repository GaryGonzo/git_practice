-- Rollback for 0069_custom_drills.sql.
-- WARNING: deletes every member-created drill and the scores logged on them.

drop trigger if exists challenges_no_custom_drill on public.challenges;
drop trigger if exists daily_golfable_no_custom_drill on public.daily_golfable;
drop function if exists public.reject_custom_drill_ref();

drop trigger if exists drills_lock_created_by on public.drills;
drop function if exists public.drills_lock_created_by();

drop policy if exists drills_read on public.drills;
drop policy if exists drills_insert_own on public.drills;
drop policy if exists drills_update_own on public.drills;
create policy "drills are publicly readable" on public.drills for select using (true);

delete from public.scores where drill_id in (select id from public.drills where created_by is not null);
delete from public.drill_ratings where drill_id in (select id from public.drills where created_by is not null);
delete from public.drills where created_by is not null;

alter table public.drills drop constraint if exists drills_custom_shape_check;
alter table public.drills drop constraint if exists drills_visibility_check;
drop index if exists drills_created_by_idx;
drop index if exists drills_community_idx;
alter table public.drills
  drop column if exists archived_at,
  drop column if exists visibility,
  drop column if exists created_by;

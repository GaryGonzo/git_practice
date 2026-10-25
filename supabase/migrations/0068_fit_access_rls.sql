-- 0068: enforce Golfable Fit access in the database, not just the client.
--
-- Before: every Fit table had one owner-only policy
--   <table>_owner  FOR ALL  USING (auth.uid() = user_id)  WITH CHECK (auth.uid() = user_id)
-- so any signed-in user could read/write their own Fit rows via the API even
-- without profiles.fit_access.
-- After: same single policy, same name, but USING and WITH CHECK also require
-- public.has_fit_access(). Users with fit_access see no difference.
-- Service-role jobs (send-fit-notifications, cron) bypass RLS and are unaffected.
-- fit_cron_log / fit_notification_runs / fit_routine_reminder_runs have RLS on
-- with no client policies (service-only) and are left alone.
-- Idempotent: safe to re-run. Rollback: supabase/rollbacks/0068_fit_access_rls_rollback.sql

create or replace function public.has_fit_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select p.fit_access from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.has_fit_access() from public;
grant execute on function public.has_fit_access() to authenticated, anon, service_role;

do $$
declare t text;
begin
  foreach t in array array[
    'fit_badges',
    'fit_benchmarks',
    'fit_block_exercises',
    'fit_block_goals',
    'fit_block_sections',
    'fit_block_weeks',
    'fit_blocks',
    'fit_body_logs',
    'fit_daily_logs',
    'fit_exercise_logs',
    'fit_exercise_options',
    'fit_notification_settings',
    'fit_nutrition_plans',
    'fit_profiles',
    'fit_routine_checks',
    'fit_routine_items',
    'fit_session_templates',
    'fit_step_logs',
    'fit_walks',
    'fit_weekly_checkins',
    'fit_workout_logs',
    'fit_workout_plans'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id and public.has_fit_access()) with check (auth.uid() = user_id and public.has_fit_access())',
      t || '_owner', t);
  end loop;
end $$;

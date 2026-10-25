-- Rollback for 0068: restore the original owner-only Fit policies exactly
-- (FOR ALL, roles public, USING/WITH CHECK auth.uid() = user_id) and drop the helper.
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
      'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_owner', t);
  end loop;
end $$;

drop function if exists public.has_fit_access();

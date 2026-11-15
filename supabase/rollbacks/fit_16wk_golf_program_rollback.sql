-- Rollback for supabase/seeds/fit_16wk_golf_program.sql: puts Block 4
-- (Peace and Strength) back as the active block, Blocks 5-6 back to
-- planned, the routine, planned dates and injuries back as they were on
-- Nov 14 2026. Refuses if any Phase 1-4 workout has been logged.

begin;

do $$
declare
  gary uuid := '49f0de4a-af0f-4ff8-9651-75ef0f448272';
begin
  if exists (select 1 from fit_workout_logs l join fit_blocks bb on bb.id = l.block_id
             where bb.user_id = gary and bb.name in ('Phase 1','Phase 2','Phase 3','Phase 4')) then
    raise exception 'Phases already have workout logs -- stop and rethink';
  end if;
  delete from fit_blocks where user_id = gary and name in ('Phase 1','Phase 2','Phase 3','Phase 4');
  update fit_blocks set status = 'active' where user_id = gary and name = 'Block 4';
  update fit_blocks set status = 'planned' where user_id = gary and name in ('Block 5','Block 6');
  delete from fit_routine_items where user_id = gary and kind = 'lift' and title = 'Lift: Strength C (core + full body)';
  update fit_routine_items set days_of_week = '{2}', time_of_day = '15:30', title = 'Lift: Upper', detail = '30-40 min. Bench 4x6, pull-ups 3x3, one accessory. 20 oz water during.', template_index = 0, remind = true, order_index = 8 where id = '0e52e637-84b6-4146-9f3a-934bc5b762a3' and user_id = gary;
  update fit_routine_items set days_of_week = '{4}', time_of_day = '15:30', title = 'Lift: Lower', detail = '30-40 min. Box squat 4x6, RDL 3x6, one accessory. 20 oz water during.', template_index = 1, remind = true, order_index = 8 where id = 'c03acf92-189b-4ee2-880b-e3ec2bafee15' and user_id = gary;
  update fit_routine_items set days_of_week = '{1}', time_of_day = null, title = 'Yoga: hips + hamstrings (20 min)', detail = 'Use the strap for the left hamstring. Pose rules: no forced left-hip internal rotation (skip hero, reclined hero, cow-face legs, 90/90, twists dropping both knees right); no pigeon or lotus; no deep knee flexion (deep squat, deep kneeling); wrists on forearms or fists, no long holds on the hands.', template_index = null, remind = false, order_index = 2 where id = 'ff37c139-4619-47da-8ba0-881008a33aad' and user_id = gary;
  update fit_routine_items set days_of_week = '{2}', time_of_day = null, title = 'Yoga: shoulders + upper back (20 min)', detail = 'Pose rules: no forced left-hip internal rotation (skip hero, reclined hero, cow-face legs, 90/90, twists dropping both knees right); no pigeon or lotus; no deep knee flexion (deep squat, deep kneeling); wrists on forearms or fists, no long holds on the hands.', template_index = null, remind = false, order_index = 2 where id = '7e89aa8e-3d29-4adf-8cb4-40b68c04caf3' and user_id = gary;
  update fit_routine_items set days_of_week = '{3}', time_of_day = '15:30', title = 'Yoga: standing flow + balance (20 min)', detail = 'Pose rules: no forced left-hip internal rotation (skip hero, reclined hero, cow-face legs, 90/90, twists dropping both knees right); no pigeon or lotus; no deep knee flexion (deep squat, deep kneeling); wrists on forearms or fists, no long holds on the hands.', template_index = null, remind = false, order_index = 10 where id = '16ed57c7-0ecf-4356-abbc-207c1540a193' and user_id = gary;
  update fit_routine_items set days_of_week = '{4}', time_of_day = null, title = 'Yoga: restorative (20 min)', detail = 'Pose rules: no forced left-hip internal rotation (skip hero, reclined hero, cow-face legs, 90/90, twists dropping both knees right); no pigeon or lotus; no deep knee flexion (deep squat, deep kneeling); wrists on forearms or fists, no long holds on the hands.', template_index = null, remind = false, order_index = 2 where id = '4461f42c-384f-4668-a5fe-0561a2abdd3a' and user_id = gary;
  update fit_routine_items set days_of_week = '{5}', time_of_day = null, title = 'Yoga: breath + calm (20 min)', detail = 'Legs up the wall, 4-in 6-out breathing.', template_index = null, remind = false, order_index = 2 where id = '5cba4d43-c1e5-43f7-8a50-41e4b2965862' and user_id = gary;
  update fit_routine_items set days_of_week = '{6,0}', time_of_day = null, title = 'Yoga (10 min) + walk or hike', detail = 'One long walk or hike this weekend. Pose rules: no forced left-hip internal rotation (skip hero, reclined hero, cow-face legs, 90/90, twists dropping both knees right); no pigeon or lotus; no deep knee flexion (deep squat, deep kneeling); wrists on forearms or fists, no long holds on the hands.', template_index = null, remind = false, order_index = 2 where id = '38c27478-b40d-417c-a9df-5fcc47abe64c' and user_id = gary;
  update fit_routine_items set days_of_week = '{3}', time_of_day = '16:00', title = 'Sim: Golfable + wedges', detail = 'Golfable (20 min), then 40 min of wedges from 40-110 yds to set targets. Putting mat if you have one.', template_index = null, remind = true, order_index = 8 where id = 'af1969d5-1f37-48d7-913b-3b93cf7515c5' and user_id = gary;
  update fit_routine_items set days_of_week = '{1}', time_of_day = '16:45', title = 'Sim: Golfable + full swing', detail = 'Golfable (20 min), then 25 min on the biggest full-swing leak from Saturday. Default: backswing rotation, then driver to a fairway-width target.', template_index = null, remind = false, order_index = 10 where id = '0ca1d987-abe3-490f-8dce-d1805676cc6b' and user_id = gary;
  update fit_routine_items set days_of_week = '{5}', time_of_day = '16:45', title = 'Sim: Golfable + 9 holes', detail = 'Golfable (10 min), then 9 holes on the sim with Saturday''s strategy: middle of greens, take your medicine after bad drives.', template_index = null, remind = false, order_index = 10 where id = 'e3574c54-b400-4488-8154-64b746d52409' and user_id = gary;
  update fit_routine_items set days_of_week = '{1,2,4,5}', time_of_day = '14:30', title = 'Pre-lift snack (optional)', detail = 'Fruit or yogurt.', template_index = null, remind = false, order_index = 6 where id = '62f858e7-7840-4736-9f95-9df2d0c8a488' and user_id = gary;
  update fit_routine_items set days_of_week = '{1,2,4,5}', time_of_day = '16:30', title = 'Meal 3: post-workout', detail = 'Biggest carb serving of the day.', template_index = null, remind = false, order_index = 9 where id = '280045ec-b3f2-4da2-8729-41ebfd3333b8' and user_id = gary;
  update fit_routine_items set days_of_week = '{6}', time_of_day = null, title = 'Round at Pine Ridge', detail = 'Putting Golfable on the practice green first. Track fairways, GIR, putts, penalties and doubles. Walk it if the knee feels good.', template_index = null, remind = false, order_index = 0 where id = 'c533cfe1-8dcd-431d-8aa8-aba7f0dc3241' and user_id = gary;
  update fit_routine_items set days_of_week = '{0}', time_of_day = null, title = 'Sunday check-in', detail = '15 min: weigh-in average, workouts, steps, sleep, Saturday''s leak.', template_index = null, remind = false, order_index = 1 where id = 'e3c3ab75-bdff-44c3-a701-45c33333eaf4' and user_id = gary;
  delete from fit_workout_plans where user_id = gary and planned_date >= '2026-11-16' and extract(isodow from planned_date) in (1, 3, 5);
  insert into fit_workout_plans (user_id, planned_date)
  select gary, d::date from unnest('{2026-11-17,2026-11-19,2026-11-24,2026-11-26}'::text[]) d
  on conflict (user_id, planned_date) do nothing;
  update fit_profiles set injuries = 'Left knee: minor meniscus injury -- most things are fine, but no running, sprinting, or jumping. Wrist: much better, but still be careful around it.'
  where user_id = gary;
end;
$$;

commit;

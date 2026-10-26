-- Golfable Fit: swap Gary's live Block 4 from "Foundation Strength" to
-- "Peace and Strength" (chosen Mon Oct 26 2026; source of truth:
-- Miyagi's gary-plan-block3.md, ACTIVE PROGRAM). NOT a migration -- run by
-- hand (SQL editor / psql) after review. Rollback:
-- supabase/rollbacks/fit_block4_peace_and_strength_rollback.sql
--
-- What it does (one transaction, Gary's user_id only):
--  * Keeps the same Block 4 row (id, dates Oct 26 - Nov 29, 5 weeks) so
--    nothing that points at it breaks. Refuses to run if any workout has
--    been logged against Block 4's templates, or if it's already applied.
--  * Replaces the 4 Foundation Strength sessions with 2 lifts:
--    Tue Upper (bench 4x6, pull-ups 3x3, 1 swap-menu accessory) and
--    Thu Lower (box squat 4x6, RDL 3x6, 1 swap-menu accessory), 30-40 min.
--  * Weeks 1-4 build (add weight only when every set is clean), week 5
--    (Nov 23-29) deload. Goals reset with targets left blank; the number
--    to beat gets set at the Nov 1 check-in.
--  * Daily routine: Mon/Fri lift reminders removed, Tue/Thu point at the
--    new sessions, a 20-min yoga item each day (10 min + walk/hike on the
--    weekend) replaces the Wed mobility flow, plus a daily steps item.
--  * Removes the planned Mon/Fri workout dates Oct 26 - Nov 27.
-- Block 1-3 logs, Blocks 5-6, nutrition plan and meals are untouched.

begin;

-- Scratch helpers live in pg_temp and disappear with the session.
create or replace function pg_temp.add_section(p_tmpl uuid, p_user uuid, p_title text, p_sets integer, p_order integer)
returns uuid language sql as $$
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (p_tmpl, p_user, p_title, p_sets, p_order) returning id;
$$;

create or replace function pg_temp.add_ex(
  p_section uuid, p_user uuid, p_name text, p_count integer, p_unit text, p_cue text, p_weight boolean, p_order integer
) returns uuid language sql as $$
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index)
  values (p_section, p_user, p_name, p_count, p_unit, p_cue, p_weight, p_order) returning id;
$$;

-- Swap menu for a slot: the slot's own exercise is the default option,
-- followed by the alternates (name, prescription, cue triples).
create or replace function pg_temp.add_swaps(p_ex uuid, p_user uuid, p_alts text[][])
returns void language plpgsql as $$
declare
  i integer;
begin
  insert into fit_exercise_options (exercise_id, user_id, name, prescription, cue, is_default, order_index)
  select e.id, p_user, e.name, e.target_count || ' ' || coalesce(e.unit, ''), e.cue, true, 0
  from fit_block_exercises e where e.id = p_ex;
  for i in 1 .. coalesce(array_length(p_alts, 1), 0) loop
    insert into fit_exercise_options (exercise_id, user_id, name, prescription, cue, is_default, order_index)
    values (p_ex, p_user, p_alts[i][1], p_alts[i][2], p_alts[i][3], false, i);
  end loop;
end;
$$;

-- Weeks 1-4 build (70/75/80/85% of working weight), week 5 deload at 60%
-- with the number-to-beat retest on its Friday.
create or replace function pg_temp.add_weeks(p_block uuid, p_user uuid, p_retest text)
returns void language sql as $$
  insert into fit_block_weeks (block_id, user_id, week_number, phase, intensity_pct, notes) values
    (p_block, p_user, 1, 'build', 70, 'Learn the lifts -- leave 3 reps in the tank.'),
    (p_block, p_user, 2, 'build', 75, 'Add a little weight where every rep looked the same.'),
    (p_block, p_user, 3, 'build', 80, 'Heaviest comfortable sets -- stop if the knee talks back.'),
    (p_block, p_user, 4, 'build', 85, 'Top week. Log every set so PRs get caught.'),
    (p_block, p_user, 5, 'deload', 60, 'Deload: half the sets, light weight. Friday: retest ' || p_retest || ' and log it as a benchmark.');
$$;

-- Treadmill incline walk + cooldown, shared by every session.
create or replace function pg_temp.add_finish(p_tmpl uuid, p_user uuid, p_order integer)
returns void language plpgsql as $$
declare s uuid;
begin
  s := pg_temp.add_section(p_tmpl, p_user, 'Conditioning', 1, p_order);
  perform pg_temp.add_ex(s, p_user, 'Treadmill Incline Walk', 15, 'min (10-12% incline, 3.0-3.4 mph)', 'Steady, nose-breathing pace. No running -- lower the incline if the knee aches.', false, 0);
  s := pg_temp.add_section(p_tmpl, p_user, 'Cooldown', 1, p_order + 1);
  perform pg_temp.add_ex(s, p_user, 'Hamstring + Calf Stretch', 30, 'sec each side', 'Tight areas: hamstrings and calves', false, 0);
  perform pg_temp.add_ex(s, p_user, 'Open Book T-Spine Rotation', 6, 'reps each side', 'Keep the knees stacked; rotate from the upper back, not the hips', false, 1);
end;
$$;

create or replace function pg_temp.add_warmup(p_tmpl uuid, p_user uuid)
returns void language plpgsql as $$
declare s uuid;
begin
  s := pg_temp.add_section(p_tmpl, p_user, 'Foam Roll', null, 0);
  perform pg_temp.add_ex(s, p_user, 'Foam Roll', null, null, 'Quads, hamstrings, calves, upper back', false, 0);
  s := pg_temp.add_section(p_tmpl, p_user, 'Warm-Up', 2, 1);
  perform pg_temp.add_ex(s, p_user, 'Cat/Cow', 6, 'reps', 'Spine mobility', false, 0);
  perform pg_temp.add_ex(s, p_user, 'Glute Bridge', 10, 'reps', 'Wake up the hips before loading them', false, 1);
  perform pg_temp.add_ex(s, p_user, 'Band Pull-Apart', 12, 'reps', 'Upper back on before pressing or pulling', false, 2);
end;
$$;

do $$
declare
  gary_id uuid := '49f0de4a-af0f-4ff8-9651-75ef0f448272';
  blk uuid;
  tmpl uuid;
  s uuid;
  ex uuid;
  safety text := 'Pose rules: no forced left-hip internal rotation (skip hero, reclined hero, cow-face legs, 90/90, twists dropping both knees right); no pigeon or lotus; no deep knee flexion (deep squat, deep kneeling); wrists on forearms or fists, no long holds on the hands.';
begin
  select id into blk from fit_blocks where user_id = gary_id and name = 'Block 4';
  if blk is null then raise exception 'Block 4 not found for Gary'; end if;
  if exists (select 1 from fit_blocks where id = blk and goal_label = 'Peace and Strength') then
    raise exception 'Already applied: Block 4 is Peace and Strength';
  end if;
  if exists (select 1 from fit_workout_logs w join fit_session_templates t on t.id = w.session_template_id
             where t.block_id = blk) or exists (select 1 from fit_workout_logs where block_id = blk) then
    raise exception 'Block 4 already has workout logs -- stop and rethink instead of deleting sessions';
  end if;

  -- Old sessions (cascade: sections, exercises, swap options), goals, weeks.
  delete from fit_session_templates where block_id = blk;
  delete from fit_block_goals where block_id = blk;
  delete from fit_block_weeks where block_id = blk;

  update fit_blocks set
    sessions_per_week = 2,
    step_goal = 8000,
    goal_label = 'Peace and Strength',
    kind = 'mobility',
    target_exercise = null, target_value = null, target_unit = null,
    start_date = '2026-10-26', week_count = 5, status = 'active',
    care_notes = 'Peace and Strength. Daily yoga (20 min; 10 min + walk/hike Sat/Sun) and 2 lifts a week, Tue upper and Thu lower at 3:30, 30-40 min. Walk 8,000 steps a day, 10,000 Wed/Sat/Sun, one long weekend walk or hike; incline treadmill walk optional. No running until a PT or doctor clears the knee. ' || safety
  where id = blk;

  insert into fit_block_weeks (block_id, user_id, week_number, phase, intensity_pct, notes) values
    (blk, gary_id, 1, 'build', null, 'Reset: current weights, leave 2-3 reps in the tank.'),
    (blk, gary_id, 2, 'build', null, 'Add weight only where every set was clean.'),
    (blk, gary_id, 3, 'build', null, 'Add weight only where every set was clean.'),
    (blk, gary_id, 4, 'build', null, 'Add weight only where every set was clean. Happy 40th (Nov 19).'),
    (blk, gary_id, 5, 'deload', 60, 'Deload (Nov 23-29): 3 sets at about 60%, no grinding. Keep the yoga and walks.');

  -- Tue: Upper
  insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Upper (Tue)', 0) returning id into tmpl;
  s := pg_temp.add_section(tmpl, gary_id, 'Warm-Up', 2, 0);
  perform pg_temp.add_ex(s, gary_id, 'Arm Circles', 10, 'each direction', null, false, 0);
  perform pg_temp.add_ex(s, gary_id, 'Band Pull-Apart', 12, 'reps', 'Upper back on before pressing', false, 1);
  s := pg_temp.add_section(tmpl, gary_id, 'Bench Press', 4, 1);
  perform pg_temp.add_ex(s, gary_id, 'Bench Press', 6, 'reps', 'Shoulder blades pinned, feet planted. Add weight only when every set is clean.', true, 0);
  s := pg_temp.add_section(tmpl, gary_id, 'Pull-Ups', 3, 2);
  perform pg_temp.add_ex(s, gary_id, 'Pull-Up', 3, 'reps', 'Full hang to chin over bar, slow lower.', true, 0);
  s := pg_temp.add_section(tmpl, gary_id, 'Accessory (pick one)', 3, 3);
  ex := pg_temp.add_ex(s, gary_id, 'Barbell Bent-Over Row', 8, 'reps', 'Flat back, pull to the belly', true, 0);
  perform pg_temp.add_swaps(ex, gary_id, array[['Band Row', '12 reps', 'Squeeze the shoulder blades'], ['Band Pull-Apart', '20 reps', 'Slow and controlled']]);
  s := pg_temp.add_section(tmpl, gary_id, 'Cooldown', 1, 4);
  perform pg_temp.add_ex(s, gary_id, 'Doorway Pec Stretch', 30, 'sec each side', null, false, 0);
  perform pg_temp.add_ex(s, gary_id, 'Cross-Body Shoulder Stretch', 30, 'sec each side', null, false, 1);

  -- Thu: Lower
  insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Lower (Thu)', 1) returning id into tmpl;
  s := pg_temp.add_section(tmpl, gary_id, 'Warm-Up', 2, 0);
  perform pg_temp.add_ex(s, gary_id, 'Leg Swings', 10, 'each direction', null, false, 0);
  perform pg_temp.add_ex(s, gary_id, 'Glute Bridge', 12, 'reps', 'Wake up the hips before loading them', false, 1);
  s := pg_temp.add_section(tmpl, gary_id, 'Box Squat', 4, 1);
  perform pg_temp.add_ex(s, gary_id, 'Box Squat', 6, 'reps', 'High-bar to a box at about parallel. Sit back, pause, drive up; never bounce or go deeper.', true, 0);
  s := pg_temp.add_section(tmpl, gary_id, 'Romanian Deadlift', 3, 2);
  perform pg_temp.add_ex(s, gary_id, 'Romanian Deadlift', 6, 'reps', 'Soft knees, hips back, flat back. Stop at the hamstrings, not the floor.', true, 0);
  s := pg_temp.add_section(tmpl, gary_id, 'Accessory (pick one)', 3, 3);
  ex := pg_temp.add_ex(s, gary_id, 'Bodyweight Single-Leg RDL', 8, 'reps each side', 'Careful with the left knee; hand on the wall is fine', false, 0);
  perform pg_temp.add_swaps(ex, gary_id, array[['Glute Bridge March', '8 reps each side', 'Hips level'], ['Lateral Band Walk', '12 steps each way', 'Knees out, small steps']]);
  s := pg_temp.add_section(tmpl, gary_id, 'Cooldown', 1, 4);
  perform pg_temp.add_ex(s, gary_id, 'Half-Kneeling Hip Flexor Stretch', 30, 'sec each side', 'Pad under the knee', false, 0);
  perform pg_temp.add_ex(s, gary_id, 'Standing Hamstring Stretch', 30, 'sec each side', 'Left side is tighter; ease in', false, 1);

  -- Goals: targets left blank for Gary to set (number to beat at the Nov 1 check-in).
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values
    (blk, gary_id, 'Lift Tue and Thu every week', 'sessions', null, 0),
    (blk, gary_id, 'Yoga most days', 'habit', null, 1),
    (blk, gary_id, 'Beat your number to beat (set Nov 1)', 'lift', null, 2),
    (blk, gary_id, 'Average 8,000 steps', 'steps', null, 3);

  -- Daily routine.
  delete from fit_routine_items where user_id = gary_id and kind = 'lift' and days_of_week in ('{1}', '{5}');
  update fit_routine_items set title = 'Lift: Upper', template_index = 0, detail = '30-40 min. Bench 4x6, pull-ups 3x3, one accessory. 20 oz water during.'
    where user_id = gary_id and kind = 'lift' and days_of_week = '{2}';
  update fit_routine_items set title = 'Lift: Lower', template_index = 1, detail = '30-40 min. Box squat 4x6, RDL 3x6, one accessory. 20 oz water during.'
    where user_id = gary_id and kind = 'lift' and days_of_week = '{4}';
  delete from fit_routine_items where user_id = gary_id and kind = 'mobility' and title = 'Mobility flow' and days_of_week = '{3}';

  insert into fit_routine_items (user_id, days_of_week, time_of_day, title, detail, kind, remind, order_index) values
    (gary_id, '{1}', null, 'Yoga: hips + hamstrings (20 min)', 'Use the strap for the left hamstring. ' || safety, 'mobility', false, 2),
    (gary_id, '{2}', null, 'Yoga: shoulders + upper back (20 min)', safety, 'mobility', false, 2),
    (gary_id, '{3}', '15:30', 'Yoga: standing flow + balance (20 min)', safety, 'mobility', false, 10),
    (gary_id, '{4}', null, 'Yoga: restorative (20 min)', safety, 'mobility', false, 2),
    (gary_id, '{5}', null, 'Yoga: breath + calm (20 min)', 'Legs up the wall, 4-in 6-out breathing.', 'mobility', false, 2),
    (gary_id, '{6,0}', null, 'Yoga (10 min) + walk or hike', 'One long walk or hike this weekend. ' || safety, 'mobility', false, 2),
    (gary_id, '{0,1,2,3,4,5,6}', null, 'Steps: 8,000 (10,000 Wed/Sat/Sun)', 'Incline treadmill walk optional. No running until a PT or doctor clears the knee.', 'walk', false, 3);

  -- Planned workout dates: Mon/Fri are no longer lift days.
  delete from fit_workout_plans where user_id = gary_id
    and planned_date between '2026-10-26' and '2026-11-29'
    and extract(isodow from planned_date) in (1, 5);
end;
$$;

commit;

-- Rollback for seeds/fit_block4_peace_and_strength.sql: puts Block 4 back to
-- Foundation Strength exactly as seeds/fit_blocks_4_6.sql built it, restores
-- the Mon/Fri lift reminders, the Wed mobility flow and the Mon/Fri planned
-- dates, and removes the yoga/steps routine items. Refuses if any workout
-- was logged against the Peace and Strength sessions.

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
begin
  select id into blk from fit_blocks where user_id = gary_id and name = 'Block 4' and goal_label = 'Peace and Strength';
  if blk is null then raise exception 'Block 4 is not Peace and Strength -- nothing to roll back'; end if;
  if exists (select 1 from fit_workout_logs where block_id = blk)
     or exists (select 1 from fit_workout_logs w join fit_session_templates t on t.id = w.session_template_id where t.block_id = blk) then
    raise exception 'Peace and Strength already has workout logs -- not rolling back automatically';
  end if;

  delete from fit_session_templates where block_id = blk;
  delete from fit_block_goals where block_id = blk;
  delete from fit_block_weeks where block_id = blk;

  update fit_blocks set sessions_per_week = 4, step_goal = 8000, goal_label = 'Foundation Strength', kind = 'strength',
    target_exercise = 'Bench Press', target_value = null, target_unit = 'lbs for 5x5',
    care_notes = 'Foundation Strength. Mon/Tue/Thu/Fri, about 45 min. Box squat to a box at or just above knee height -- sit back, never bounce. No running, jumping, or single-leg loading. Ice the knee if it flares.'
  where id = blk;

    perform pg_temp.add_weeks(blk, gary_id, 'bench press 5x5');

    -- Mon: Lower A
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Lower A (Mon)', 0) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 5, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Box Squat', 5, 'reps', 'Sit back to the box, pause, drive up. Shins stay vertical.', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Goblet Box Squat', '5 reps', 'Lighter, same depth'], ['Trap-Bar Box Squat', '5 reps', 'Handles at your sides, sit to the box']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Hinge + Core', 3, 3);
    ex := pg_temp.add_ex(s, gary_id, 'Romanian Deadlift', 8, 'reps', 'Soft knees, push the hips back, flat back', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Dumbbell RDL', '8 reps', 'Same hinge, lighter'], ['Trap-Bar RDL', '8 reps', 'Easier on the low back']]);
    perform pg_temp.add_ex(s, gary_id, 'Pallof Press', 10, 'reps each side', 'Anti-rotation; ribs down', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Tue: Upper A
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Upper A (Tue)', 1) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 5, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Bench Press', 5, 'reps', 'The number to beat. Shoulder blades pinned, feet planted.', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Dumbbell Bench Press', '5 reps', 'Wrist-friendlier, neutral grip ok'], ['Push-Up', '10 reps', 'Bodyweight fallback']]);
    ex := pg_temp.add_ex(s, gary_id, 'Pull-Up', 5, 'reps', 'Full hang to chin over bar; use a band if needed', true, 1);
    perform pg_temp.add_swaps(ex, gary_id, array[['Band-Assisted Pull-Up', '5 reps', 'Lightest band you can do clean reps with'], ['Lat Pulldown', '8 reps', 'Pull to the upper chest']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Accessory', 3, 3);
    perform pg_temp.add_ex(s, gary_id, 'Chest-Supported Dumbbell Row', 10, 'reps', 'Squeeze the shoulder blade back', true, 0);
    perform pg_temp.add_ex(s, gary_id, 'Face Pull', 15, 'reps', 'Shoulder health', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Thu: Lower B
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Lower B (Thu)', 2) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Romanian Deadlift', 6, 'reps', 'Heavier than Monday, same form', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Trap-Bar RDL', '6 reps', 'Easier on the low back']]);
    ex := pg_temp.add_ex(s, gary_id, 'Box Squat', 8, 'reps', 'Lighter, smooth reps', true, 1);
    perform pg_temp.add_swaps(ex, gary_id, array[['Goblet Box Squat', '8 reps', 'Same depth']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Core', 3, 3);
    perform pg_temp.add_ex(s, gary_id, 'Back Extension', 12, 'reps', 'Glutes and hamstrings, no low-back crank', false, 0);
    perform pg_temp.add_ex(s, gary_id, 'Dead Bug', 8, 'reps each side', 'Low back stays flat', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Fri: Upper B
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Upper B (Fri)', 3) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Bench Press', 8, 'reps', 'Volume day -- lighter than Tuesday', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Dumbbell Bench Press', '8 reps', 'Neutral grip ok'], ['Push-Up', '12 reps', 'Bodyweight fallback']]);
    ex := pg_temp.add_ex(s, gary_id, 'Pull-Up', 6, 'reps', 'Controlled lower', true, 1);
    perform pg_temp.add_swaps(ex, gary_id, array[['Band-Assisted Pull-Up', '6 reps', ''], ['Lat Pulldown', '10 reps', '']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Accessory', 3, 3);
    perform pg_temp.add_ex(s, gary_id, 'Standing Landmine Press', 8, 'reps each arm', 'Feet square, press up and out; no kneeling on the knee', true, 0);
    perform pg_temp.add_ex(s, gary_id, 'Suitcase Carry', 30, 'sec each side', 'Tall posture, slow steps', true, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values
      (blk, gary_id, 'Hit all 20 sessions', 'sessions', 20, 0),
      (blk, gary_id, 'Beat your bench 5x5', 'lift', null, 1),
      (blk, gary_id, 'Box squat 5x5 with no knee pain', 'habit', null, 2),
      (blk, gary_id, 'Average 8,000 steps', 'steps', 8000, 3);

  -- Routine items back to how they were.
  delete from fit_routine_items where user_id = gary_id and kind in ('mobility', 'walk')
    and (title like 'Yoga%' or title like 'Steps: 8,000%');
  update fit_routine_items set title = 'Lift: Upper A', template_index = 1, detail = '20 oz water during.'
    where user_id = gary_id and kind = 'lift' and days_of_week = '{2}';
  update fit_routine_items set title = 'Lift: Lower B', template_index = 2, detail = '20 oz water during.'
    where user_id = gary_id and kind = 'lift' and days_of_week = '{4}';
  insert into fit_routine_items (id, user_id, days_of_week, time_of_day, title, detail, kind, template_index, remind, order_index, created_at) values
    ('ed8808cf-65e3-4c14-8d86-f72fc5cc814e', gary_id, '{1}', '15:30', 'Lift: Lower A', '20 oz water during.', 'lift', 0, true, 8, '2026-10-17T19:03:03.489163+00:00'),
    ('301f6ce8-4be7-4321-a98e-132269de3268', gary_id, '{5}', '15:30', 'Lift: Upper B', '20 oz water during.', 'lift', 3, true, 8, '2026-10-17T19:03:03.489163+00:00'),
    ('e6d4579f-3b00-4a73-b64d-392faef4e656', gary_id, '{3}', '15:30', 'Mobility flow', '20 min: hip flexors, hamstrings, calves, T-spine.', 'mobility', null, false, 10, '2026-10-17T19:03:03.489163+00:00')
  on conflict (id) do nothing;

  insert into fit_workout_plans (user_id, planned_date)
  select gary_id, d::date from unnest(array['2026-10-26','2026-10-30','2026-11-02','2026-11-06','2026-11-09','2026-11-13',
                                            '2026-11-16','2026-11-20','2026-11-23','2026-11-27']) d
  on conflict (user_id, planned_date) do nothing;
end;
$$;

commit;

-- Golfable Fit: Blocks 4-6 (Nov 30 2026 -> Mar 14 2027). NOT a migration --
-- run by hand (SQL editor / psql) once 0067 is live. Idempotent: each
-- block is skipped if one with the same name already exists for Gary.
--
-- Every block: 5 weeks (weeks 1-4 build, week 5 deload + retest of the
-- number to beat), 4 sessions/week on Mon/Tue/Thu/Fri, ~45 min each,
-- ending with treadmill incline walking for conditioning.
--
-- Knee-safe by design: no running, jumping, or HIIT; bilateral lifts
-- only (no lunges/split squats/step-ups); no drills that drive the left
-- hip into internal rotation under load. Everything seeds as 'planned';
-- tracks_weight lifts start with target_weight_lbs = null (build by feel).

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
  ---------------------------------------------------------------------------
  -- Block 4: Foundation Strength (Mon Nov 30 2026 - Sun Jan 3 2027)
  ---------------------------------------------------------------------------
  if not exists (select 1 from fit_blocks where user_id = gary_id and name = 'Block 4') then
    insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index,
                            goal_label, target_exercise, target_value, target_unit, start_date, kind)
    values (gary_id, 'Block 4', 5, 4, 8000,
      'Foundation Strength. Mon/Tue/Thu/Fri, about 45 min. Box squat to a box at or just above knee height -- sit back, never bounce. No running, jumping, or single-leg loading. Ice the knee if it flares.',
      'planned', 4,
      'Foundation Strength', 'Bench Press', null, 'lbs for 5x5', '2026-11-30', 'strength')
    returning id into blk;
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
  end if;

  ---------------------------------------------------------------------------
  -- Block 5: Rotate and Reach (Mon Jan 4 - Sun Feb 7 2027)
  ---------------------------------------------------------------------------
  if not exists (select 1 from fit_blocks where user_id = gary_id and name = 'Block 5') then
    insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index,
                            goal_label, target_exercise, target_value, target_unit, start_date, kind)
    values (gary_id, 'Block 5', 5, 4, 8000,
      'Rotate and Reach. Strength stays, rotation and T-spine reach come in. Rotate through the upper back with the hips quiet -- no drills that drive the left hip into internal rotation. No running, jumping, or single-leg loading.',
      'planned', 5,
      'Rotate and Reach', 'Hang Deadlift', null, 'lbs for 5x3', '2027-01-04', 'mobility')
    returning id into blk;
    perform pg_temp.add_weeks(blk, gary_id, 'hang deadlift 5x3');

    -- Mon: Hinge + Rotate
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Hinge + Rotate (Mon)', 0) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 5, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Hang Deadlift', 3, 'reps', 'The number to beat. Bar starts at the knee, snap the hips through.', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Trap-Bar Hang Deadlift', '3 reps', 'Handles at mid-shin, same snap'], ['Kettlebell Deadlift', '5 reps', 'Lighter fallback']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Rotation', 3, 3);
    ex := pg_temp.add_ex(s, gary_id, 'Cable Chop (High to Low)', 8, 'reps each side', 'Turn through the ribs, hips square', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Band Chop', '10 reps each side', 'Same pattern with a band']]);
    perform pg_temp.add_ex(s, gary_id, 'Quadruped T-Spine Reach-Through', 6, 'reps each side', 'Reach and open; hips stay still', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Tue: Press + Reach
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Press + Reach (Tue)', 1) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Bench Press', 5, 'reps', 'Hold on to Block 4 strength', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Dumbbell Bench Press', '6 reps', '']]);
    ex := pg_temp.add_ex(s, gary_id, 'Pull-Up', 5, 'reps', 'Full reach at the bottom', true, 1);
    perform pg_temp.add_swaps(ex, gary_id, array[['Band-Assisted Pull-Up', '5 reps', ''], ['Lat Pulldown', '8 reps', '']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Reach', 3, 3);
    perform pg_temp.add_ex(s, gary_id, 'Landmine Rotational Press', 8, 'reps each side', 'Pivot the back foot, turn the torso, press long', true, 0);
    perform pg_temp.add_ex(s, gary_id, 'Overhead Reach Wall Slide', 10, 'reps', 'Ribs down, reach tall', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Thu: Squat + Anti-Rotation
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Squat + Brace (Thu)', 2) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Box Squat', 6, 'reps', 'Sit back to the box', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Goblet Box Squat', '8 reps', '']]);
    ex := pg_temp.add_ex(s, gary_id, 'Romanian Deadlift', 8, 'reps', 'Long hamstrings', true, 1);
    perform pg_temp.add_swaps(ex, gary_id, array[['Dumbbell RDL', '8 reps', '']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Core', 3, 3);
    perform pg_temp.add_ex(s, gary_id, 'Pallof Press with Overhead Reach', 8, 'reps each side', 'Press out, reach up, hips quiet', false, 0);
    perform pg_temp.add_ex(s, gary_id, 'Side Plank', 20, 'sec each side', 'Straight line from head to heels', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Fri: Pull + Rotate
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Pull + Rotate (Fri)', 3) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Main Lifts', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Hang Deadlift', 5, 'reps', 'Lighter, crisp hip snap', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Trap-Bar Hang Deadlift', '5 reps', '']]);
    perform pg_temp.add_ex(s, gary_id, 'Single-Arm Cable Row with Rotation', 10, 'reps each arm', 'Reach long, row and turn through the upper back', true, 1);
    s := pg_temp.add_section(tmpl, gary_id, 'Rotation', 3, 3);
    perform pg_temp.add_ex(s, gary_id, 'Cable Lift (Low to High)', 8, 'reps each side', 'Rotate from the T-spine', true, 0);
    perform pg_temp.add_ex(s, gary_id, 'Open Book with Reach', 6, 'reps each side', 'Exhale into the end range', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values
      (blk, gary_id, 'Hit all 20 sessions', 'sessions', 20, 0),
      (blk, gary_id, 'Beat your hang deadlift 5x3', 'lift', null, 1),
      (blk, gary_id, 'Open book: shoulder touches the floor both sides', 'habit', null, 2),
      (blk, gary_id, 'Average 8,000 steps', 'steps', 8000, 3);
  end if;

  ---------------------------------------------------------------------------
  -- Block 6: Power and Speed (Mon Feb 8 - Sun Mar 14 2027)
  ---------------------------------------------------------------------------
  if not exists (select 1 from fit_blocks where user_id = gary_id and name = 'Block 6') then
    insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index,
                            goal_label, target_exercise, target_value, target_unit, start_date, kind)
    values (gary_id, 'Block 6', 5, 4, 8000,
      'Power and Speed. Fast intent with no jumping or running. Throws are standing, feet square, with the turn coming from the upper back and the trail side -- do not drive into the left hip. Stop any set once speed drops.',
      'planned', 6,
      'Power and Speed', 'Med-Ball Rotational Throw', null, 'ft (best of 3 each side)', '2027-02-08', 'power')
    returning id into blk;
    perform pg_temp.add_weeks(blk, gary_id, 'med-ball rotational throw distance');

    -- Mon: Lower Power
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Lower Power (Mon)', 0) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Power', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Kettlebell Swing', 10, 'reps', 'Hinge, snap the hips -- knees soft, not squatting', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Dumbbell Swing', '10 reps', ''], ['Cable Pull-Through', '12 reps', 'Lower-impact fallback']]);
    ex := pg_temp.add_ex(s, gary_id, 'Speed Box Squat', 3, 'reps', '~50-60% load, drive up as fast as possible', true, 1);
    perform pg_temp.add_swaps(ex, gary_id, array[['Goblet Box Squat', '5 reps', 'Fast up']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Strength', 3, 3);
    ex := pg_temp.add_ex(s, gary_id, 'Hang Deadlift', 3, 'reps', 'Keep the Block 5 strength', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Trap-Bar Hang Deadlift', '3 reps', '']]);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Tue: Upper Power
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Upper Power (Tue)', 1) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Power', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Med-Ball Chest Pass', 5, 'reps', 'Throw into the wall as hard as you can', false, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Speed Push-Up', '6 reps', 'Fast up, no clap']]);
    ex := pg_temp.add_ex(s, gary_id, 'Bench Press', 3, 'reps', 'Heavy triples, fast bar speed', true, 1);
    perform pg_temp.add_swaps(ex, gary_id, array[['Dumbbell Bench Press', '5 reps', '']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Pull', 3, 3);
    ex := pg_temp.add_ex(s, gary_id, 'Pull-Up', 5, 'reps', 'Fast up, slow down', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Band-Assisted Pull-Up', '5 reps', ''], ['Lat Pulldown', '8 reps', '']]);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Thu: Rotational Power
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Rotational Power (Thu)', 2) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Throws', 4, 2);
    ex := pg_temp.add_ex(s, gary_id, 'Med-Ball Rotational Throw', 4, 'throws each side', 'The number to beat. Standing, feet square, turn from the upper back; let the feet pivot.', false, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Med-Ball Scoop Toss (Wall)', '5 each side', 'Shorter range'], ['Cable Rotational Punch', '6 each side', 'If no throwing space']]);
    s := pg_temp.add_section(tmpl, gary_id, 'Strength', 3, 3);
    ex := pg_temp.add_ex(s, gary_id, 'Romanian Deadlift', 6, 'reps', 'Strong hinge', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Trap-Bar RDL', '6 reps', '']]);
    perform pg_temp.add_ex(s, gary_id, 'Pallof Press', 10, 'reps each side', 'Anti-rotation between throws', false, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    -- Fri: Speed Strength
    insert into fit_session_templates (block_id, user_id, name, order_index) values (blk, gary_id, 'Speed Strength (Fri)', 3) returning id into tmpl;
    perform pg_temp.add_warmup(tmpl, gary_id);
    s := pg_temp.add_section(tmpl, gary_id, 'Power', 4, 2);
    perform pg_temp.add_ex(s, gary_id, 'Med-Ball Overhead Slam', 6, 'reps', 'Reach tall, slam hard -- no jumping', false, 0);
    perform pg_temp.add_ex(s, gary_id, 'Cable Chop (Speed)', 6, 'reps each side', 'Fast rotation, hips quiet', true, 1);
    s := pg_temp.add_section(tmpl, gary_id, 'Strength', 3, 3);
    ex := pg_temp.add_ex(s, gary_id, 'Box Squat', 5, 'reps', 'Moderate weight, fast up', true, 0);
    perform pg_temp.add_swaps(ex, gary_id, array[['Goblet Box Squat', '6 reps', '']]);
    perform pg_temp.add_ex(s, gary_id, 'Chest-Supported Dumbbell Row', 8, 'reps', '', true, 1);
    perform pg_temp.add_finish(tmpl, gary_id, 4);

    insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values
      (blk, gary_id, 'Hit all 20 sessions', 'sessions', 20, 0),
      (blk, gary_id, 'Beat your med-ball rotational throw', 'benchmark', null, 1),
      (blk, gary_id, 'Keep bench and hang deadlift within 5 lbs of your best', 'lift', null, 2),
      (blk, gary_id, 'Average 8,000 steps', 'steps', 8000, 3);
  end if;
end $$;

-- Nutrition streak targets: 110 oz water, 4 protein hits, kitchen closed by 8pm.
update fit_nutrition_plans
set water_goal_oz = 110, protein_hits_goal = 4, kitchen_close_time = '20:00'
where user_id = '49f0de4a-af0f-4ff8-9651-75ef0f448272';

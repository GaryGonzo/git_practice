-- Golfable Fit: Block 2 -- a 5-day/week 5x5-style program (push-ups stand
-- in for bench press, building to 5x20; front squat and hang deadlift
-- replace back squat/conventional deadlift; pull-ups and overhead press
-- stay as-is). Seeded with status "planned" rather than "active" -- it
-- sits ready until the player ends Block 1 and taps "Begin New Program",
-- rather than taking over immediately. No starting weights are set
-- (tracks_weight exercises get target_weight_lbs = null) since the plan
-- is to start light for the first couple of weeks and build up by feel.

do $$
declare
  gary_id uuid := '49f0de4a-af0f-4ff8-9651-75ef0f448272';
  block2_id uuid;
  tmpl_id uuid;
  foam_id uuid;
  warmup_id uuid;
  activation_id uuid;
  main_id uuid;
  accessory_id uuid;
  stretch_id uuid;
begin
  if exists (select 1 from fit_blocks where user_id = gary_id and name = 'Block 2') then
    return;
  end if;

  insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index)
  values (
    gary_id,
    'Block 2',
    6,
    5,
    8000,
    'A 5x5-style block -- start every main lift light for the first couple of weeks and build weight up from there. Keep icing the knee if it flares up, and keep working thoracic and hip mobility into warm-ups and cool-downs.',
    'planned',
    2
  )
  returning id into block2_id;

  -- Day 1: Push Day (push-ups in place of bench press, building to 5x20)
  insert into fit_session_templates (block_id, user_id, name, order_index)
  values (block2_id, gary_id, 'Push Day', 0)
  returning id into tmpl_id;

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Foam Roll', null, 0) returning id into foam_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (foam_id, gary_id, 'Foam Roll', null, null, 'General mobility and recovery', 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Warm-Up', 2, 1) returning id into warmup_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (warmup_id, gary_id, 'Arm Circles', 10, 'reps each direction', 'Shoulder joint warm-up', 0),
    (warmup_id, gary_id, 'Cat/Cow', 6, 'reps', 'Spine mobility', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Activation', 2, 2) returning id into activation_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (activation_id, gary_id, 'Serratus Push-Up', 8, 'reps', 'Scapular protraction and shoulder stability before pressing', 0),
    (activation_id, gary_id, 'Band Pull-Apart', 12, 'reps', 'Rear delt and upper back activation to balance the press', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Main Lift', 5, 3) returning id into main_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (main_id, gary_id, 'Push-Up', 5, 'reps', 'Building to 5x20 -- add a rep or two each week as it gets easier. Weight open for later, once you''re ready for a weighted vest or to transition to bench press.', true, 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Accessories', 3, 4) returning id into accessory_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (accessory_id, gary_id, 'Side Plank with Reach-Through', 8, 'reps each side', 'Core stability with light rotation', false, 0),
    (accessory_id, gary_id, 'Barbell Skull Crusher', 10, 'reps', 'Triceps strength to support the push-up lockout', true, 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Stretches', null, 5) returning id into stretch_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (stretch_id, gary_id, 'Doorway Pec Stretch', 30, 'sec each side', 'Shoulder capsule', 0),
    (stretch_id, gary_id, 'Cross-Body Shoulder Stretch', 30, 'sec each side', 'Shoulder capsule', 1),
    (stretch_id, gary_id, 'Thread the Needle', 30, 'sec each side', 'Thoracic rotation', 2),
    (stretch_id, gary_id, 'Standing Hamstring Stretch', 30, 'sec each side', 'Hamstring', 3);

  -- Day 2: Front Squat Day
  insert into fit_session_templates (block_id, user_id, name, order_index)
  values (block2_id, gary_id, 'Front Squat Day', 1)
  returning id into tmpl_id;

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Foam Roll', null, 0) returning id into foam_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (foam_id, gary_id, 'Foam Roll', null, null, 'General mobility and recovery', 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Warm-Up', 2, 1) returning id into warmup_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (warmup_id, gary_id, 'Bodyweight Squat to Stand', 8, 'reps', 'Hip and ankle warm-up for squatting', 0),
    (warmup_id, gary_id, 'World''s Greatest Stretch', 5, 'reps each side', 'Full-body dynamic mobility', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Activation', 2, 2) returning id into activation_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (activation_id, gary_id, 'Fire Hydrant', 10, 'reps each side', 'Glute activation before squatting', 0),
    (activation_id, gary_id, 'Glute Bridge', 12, 'reps', 'Posterior chain wake-up for the squat', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Main Lift', 5, 3) returning id into main_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (main_id, gary_id, 'Front Squat', 5, 'reps', '5x5 -- start light the first couple weeks and build weight up from there', true, 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Accessories', 3, 4) returning id into accessory_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (accessory_id, gary_id, 'Russian Twist', 16, 'reps (8 each side)', 'Rotation and core', false, 0),
    (accessory_id, gary_id, 'Lunge Hold', 20, 'sec each side', 'Single-leg strength and balance', false, 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Stretches', null, 5) returning id into stretch_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (stretch_id, gary_id, 'Standing Hamstring Stretch', 30, 'sec each side', 'Hamstring', 0),
    (stretch_id, gary_id, 'Wall Calf Stretch', 30, 'sec each side', 'Calf', 1),
    (stretch_id, gary_id, 'Seated Thoracic Rotation', 30, 'sec each side', 'Thoracic rotation', 2),
    (stretch_id, gary_id, 'Child''s Pose with Reach', 30, 'sec', 'Shoulder capsule and thoracic mobility', 3);

  -- Day 3: Hang Deadlift Day
  insert into fit_session_templates (block_id, user_id, name, order_index)
  values (block2_id, gary_id, 'Hang Deadlift Day', 2)
  returning id into tmpl_id;

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Foam Roll', null, 0) returning id into foam_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (foam_id, gary_id, 'Foam Roll', null, null, 'General mobility and recovery', 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Warm-Up', 2, 1) returning id into warmup_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (warmup_id, gary_id, 'Cat/Cow', 6, 'reps', 'Spine mobility', 0),
    (warmup_id, gary_id, 'Inchworm to Downward Dog', 5, 'reps', 'Hamstring and hip prep', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Activation', 2, 2) returning id into activation_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (activation_id, gary_id, 'Fire Hydrant', 10, 'reps each side', 'Glute activation before hinging', 0),
    (activation_id, gary_id, 'Bird Dog', 8, 'reps each side', 'Posterior chain and core activation', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Main Lift', 5, 3) returning id into main_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (main_id, gary_id, 'Hang Deadlift', 5, 'reps', '5x5 -- start light the first couple weeks and build weight up from there', true, 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Accessories', 3, 4) returning id into accessory_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (accessory_id, gary_id, 'Half-Kneeling Band Chop', 10, 'reps each side', 'Rotation and core', false, 0),
    (accessory_id, gary_id, 'Single-Leg Deadlift', 8, 'reps each side', 'Posterior chain strength and balance', false, 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Stretches', null, 5) returning id into stretch_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (stretch_id, gary_id, 'Downward Dog Calf Stretch', 30, 'sec', 'Calf', 0),
    (stretch_id, gary_id, 'Seated Forward Fold', 30, 'sec', 'Hamstring', 1),
    (stretch_id, gary_id, 'Open Book Stretch', 30, 'sec each side', 'Thoracic rotation', 2),
    (stretch_id, gary_id, 'Sleeper Stretch', 30, 'sec each side', 'Shoulder capsule', 3);

  -- Day 4: Pull-Up Day
  insert into fit_session_templates (block_id, user_id, name, order_index)
  values (block2_id, gary_id, 'Pull-Up Day', 3)
  returning id into tmpl_id;

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Foam Roll', null, 0) returning id into foam_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (foam_id, gary_id, 'Foam Roll', null, null, 'General mobility and recovery', 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Warm-Up', 2, 1) returning id into warmup_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (warmup_id, gary_id, 'Arm Circles', 10, 'reps each direction', 'Shoulder joint warm-up', 0),
    (warmup_id, gary_id, 'Scapular Wall Slide', 10, 'reps', 'Shoulder and scapular mobility', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Activation', 2, 2) returning id into activation_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (activation_id, gary_id, 'Band Pull-Apart', 12, 'reps', 'Scapular activation', 0),
    (activation_id, gary_id, 'Scapular Pull-Up', 8, 'reps', 'Dead-hang shrug to prime the pull-up pattern', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Main Lift', 5, 3) returning id into main_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (main_id, gary_id, 'Pull-Up', 5, 'reps', '5x5 -- adjust a rep up or down to match how it feels. Weight open for later, once you''re ready to add a weighted vest or belt.', true, 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Accessories', 3, 4) returning id into accessory_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (accessory_id, gary_id, 'Hanging Knee Raise with Rotation', 10, 'reps each side', 'Rotation and core', false, 0),
    (accessory_id, gary_id, 'Barbell Curl', 10, 'reps', 'Biceps and grip strength to support pulling', true, 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Stretches', null, 5) returning id into stretch_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (stretch_id, gary_id, 'Cross-Body Shoulder Stretch', 30, 'sec each side', 'Shoulder capsule', 0),
    (stretch_id, gary_id, 'Doorway Pec Stretch', 30, 'sec each side', 'Shoulder capsule', 1),
    (stretch_id, gary_id, 'Thread the Needle', 30, 'sec each side', 'Thoracic rotation', 2),
    (stretch_id, gary_id, 'Wall Calf Stretch', 30, 'sec each side', 'Calf', 3);

  -- Day 5: Overhead Press Day
  insert into fit_session_templates (block_id, user_id, name, order_index)
  values (block2_id, gary_id, 'Overhead Press Day', 4)
  returning id into tmpl_id;

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Foam Roll', null, 0) returning id into foam_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (foam_id, gary_id, 'Foam Roll', null, null, 'General mobility and recovery', 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Warm-Up', 2, 1) returning id into warmup_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (warmup_id, gary_id, 'Arm Circles', 10, 'reps each direction', 'Shoulder joint warm-up', 0),
    (warmup_id, gary_id, 'T-Rotation from Table Top', 4, 'reps each side', 'T-spine rotation', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Activation', 2, 2) returning id into activation_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (activation_id, gary_id, 'Shoulder ABCs', null, null, 'Shoulder capsule activation before pressing', 0),
    (activation_id, gary_id, 'Wall Slide', 10, 'reps', 'Scapular and shoulder capsule activation', 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Main Lift', 5, 3) returning id into main_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (main_id, gary_id, 'Overhead Press', 5, 'reps', '5x5 -- start light the first couple weeks and build weight up from there', true, 0);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Accessories', 3, 4) returning id into accessory_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values
    (accessory_id, gary_id, 'Plank Thread the Needle', 8, 'reps each side', 'Rotation and core, shoulder-safe after pressing', false, 0),
    (accessory_id, gary_id, 'Band Lateral Raise', 12, 'reps', 'Shoulder and delt isolation', false, 1);

  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index)
  values (tmpl_id, gary_id, 'Stretches', null, 5) returning id into stretch_id;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, order_index) values
    (stretch_id, gary_id, 'Sleeper Stretch', 30, 'sec each side', 'Shoulder capsule', 0),
    (stretch_id, gary_id, 'Child''s Pose with Reach', 30, 'sec', 'Shoulder capsule and thoracic mobility', 1),
    (stretch_id, gary_id, 'Seated Thoracic Rotation', 30, 'sec each side', 'Thoracic rotation', 2),
    (stretch_id, gary_id, 'Standing Hamstring Stretch', 30, 'sec each side', 'Hamstring', 3);
end $$;

-- Golfable Fit: Gary's 16-Week Golf Strength & Mobility Program (chosen
-- Sat Nov 14 2026: "Replace Blocks 4-6"). Source of truth: the Claude Doc
-- "16-Week Golf Strength & Mobility Program". NOT a migration -- run once
-- after 0069. Rollback: supabase/rollbacks/fit_16wk_golf_program_rollback.sql
--
-- What it does (one transaction, Gary's user_id only):
--  * Block 4 (Peace and Strength) -> completed. Blocks 5-6 -> archived
--    (kept, never deleted). Refuses if any of them has a logged workout.
--  * Adds Phase 1 (active, starts Mon Nov 16) and Phases 2-4 (planned,
--    Dec 14 / Jan 11 / Feb 8), 4 weeks each, 3 sessions: Strength A (Mon),
--    B (Wed), C (Fri). Week 4 of each phase is the deload + test week.
--  * Routine: lifts move to Mon/Wed/Fri 3:30; Tue/Thu 3:30 = mobility plus;
--    a daily 10-min mobility item replaces the yoga items (yoga rows are
--    taken off every day, not deleted); sims say "at your golf stage".
--  * Planned workout dates: Mon/Wed/Fri Nov 16 - Mar 5; the Tue/Thu dates
--    from Nov 17 on are removed.
--  * Profile injuries: adds the left low back and left hip.

begin;

-- Scratch helpers live in pg_temp and disappear with the session.
-- One section holding one exercise (most slots in this program):
create or replace function pg_temp.sx(t uuid, g uuid, o int, title text, sets int, nm text, cnt int, u text, cue text, w boolean)
returns void language plpgsql as $f$
declare s uuid;
begin
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, g, title, sets, o) returning id into s;
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values (s, g, nm, cnt, u, cue, w, 0);
end $f$;
-- One exercise added to an existing section (the warm-up):
create or replace function pg_temp.wx(s uuid, g uuid, o int, nm text, cnt int, u text, cue text)
returns void language sql as $f$
  insert into fit_block_exercises (section_id, user_id, name, target_count, unit, cue, tracks_weight, order_index) values (s, g, nm, cnt, u, cue, false, o);
$f$;

do $$
declare
  gary uuid := '49f0de4a-af0f-4ff8-9651-75ef0f448272';
  b uuid; t uuid; s uuid;
begin
  if exists (select 1 from fit_blocks where user_id = gary and goal_label = 'Foundation' and name = 'Phase 1') then
    raise exception 'Already applied: Phase 1 exists';
  end if;
  if exists (select 1 from fit_workout_logs l join fit_blocks bb on bb.id = l.block_id
             where bb.user_id = gary and bb.name in ('Block 4','Block 5','Block 6')) then
    raise exception 'Blocks 4-6 have workout logs -- stop and rethink';
  end if;

  update fit_blocks set status = 'completed' where user_id = gary and name = 'Block 4';
  update fit_blocks set status = 'archived' where user_id = gary and name in ('Block 5','Block 6');


  -- Phase 1: Foundation
  insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index, goal_label, kind, start_date, target_exercise, target_value, target_unit)
  values (gary, 'Phase 1', 4, 3, 8000, 'Foundation (weeks 1-4, Nov 16 - Dec 13). Trunk endurance, glutes on, a hinge and squat that never provoke the back. Every set ends with 2-3 good reps left (RPE 6-7). Holds are many short 10 s holds. Stop rules: sharp or pinching pain = stop that exercise; above 3/10 = lighten or shorten the range; 4/10+ or worse the next morning = drop back one week. Red flags (numbness or pain below the knee, leg weakness, saddle numbness, bladder or bowel change, night pain, fever) = get checked. Left hip: never force internal rotation or deep flexion; stop depth short of any groin pinch. Knee: box squats only, no jumping or running. Wrist: neutral grips, straps on heavy pulls. Full plan: the 16-Week Golf Strength & Mobility doc.', 'active', 7, 'Foundation', 'standard', '2026-11-16', 'Side Plank', 30, 'sec each side')
  returning id into b;
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 1, 'build', 'Learn the holds. Leave 3 reps in the tank on every lift.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 2, 'build', 'Add a rep to the holds. RDL +10 lb only if the back stayed 0-2/10.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 3, 'build', 'Top week of the phase. Same rules: clean and calm, then progress.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 4, 'benchmark', 'Deload + test: about a third fewer sets. Test side plank, curl-up, bird dog and single-leg balance; log them in the Sunday check-in.');
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Side plank 30 s each side', 'habit', 30, 0);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Curl-up 5 x 10 s with no back discomfort', 'habit', null, 1);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Bird dog 10 each side, hips still', 'habit', null, 2);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Back pain 2/10 or less in daily life', 'habit', 2, 3);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, '3 lifts and daily mobility most weeks', 'sessions', 3, 4);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength A: Core + pelvis (Mon)', 0) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'McGill Curl-Up', 3, 'McGill Curl-Up', 5, 'reps, 10 s holds (5, 3, then 1)', 'W2 6-4-2 · W3 7-5-3 · W4 5-3-1 + test. One knee bent, hands under the low back, lift head and shoulders as one block an inch.', false);
  perform pg_temp.sx(t, gary, 2, 'Modified Side Plank', 2, 'Modified Side Plank (knees)', 3, 'x 10 s holds each side', 'W2 4 holds · W3 5 holds · W4 3 + max test. Elbow under shoulder, straight line ear-hip-knee.', false);
  perform pg_temp.sx(t, gary, 3, 'Bird Dog', 3, 'Bird Dog', 6, 'reps each side, 10 s holds', 'W2 3x8 · W3 3x10 · W4 2x6. Reach long, not high; hips don''t rotate.', false);
  perform pg_temp.sx(t, gary, 4, 'Dead Bug', 2, 'Dead Bug', 6, 'reps each side', 'W2 3x6 · W3 3x8 · W4 2x6. Low back gently down, exhale as you extend.', false);
  perform pg_temp.sx(t, gary, 5, 'Glute Bridge', 3, 'Glute Bridge', 12, 'reps, 2 s squeeze', 'W2 3x15 · W3 3x15 with 3 s hold · W4 2x12. Ribs down, no arching at the top.', false);
  perform pg_temp.sx(t, gary, 6, 'Side-Lying Hip Abduction', 2, 'Side-Lying Hip Abduction', 12, 'reps each side', 'W2 3x12 · W3 3x15 · W4 2x12. Top leg slightly behind, toes forward.', false);
  perform pg_temp.sx(t, gary, 7, 'Recover: T-spine', 2, 'Quadruped T-Spine Rotation', 8, 'reps each side', 'Hips stacked over knees -- don''t sit back toward the heels.', false);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength B: Hips + posterior chain (Wed)', 1) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Main lift: Barbell RDL', 3, 'Barbell RDL', 8, 'reps, 3 s lowering', 'W2-W3 3x8 · W4 2x8. Start at about half your Block 3 weight (or 95 lb, whichever is lighter). +10 lb a week only if the back is 0-2/10 that day and the next morning. Straps if grip limits.', true);
  perform pg_temp.sx(t, gary, 2, 'Barbell Hip Thrust', 3, 'Barbell Hip Thrust', 10, 'reps', 'W2 3x10 · W3 3x12 · W4 2x10. Bar pad or towel. Chin tucked, lock out with the glutes.', true);
  perform pg_temp.sx(t, gary, 3, 'Main lift: High Box Squat', 3, 'High Box Squat', 8, 'reps', 'W2-W3 3x8 · W4 2x8. Box above parallel. Slightly wide, toes out; light touch, no plopping. Stop short of any left-hip pinch.', true);
  perform pg_temp.sx(t, gary, 4, 'Band Lateral Walk', 2, 'Band Lateral Walk', 10, 'steps each way', 'W2 2x12 · W3 3x12 · W4 2x10. Small athletic bend, feet never meet.', false);
  perform pg_temp.sx(t, gary, 5, 'Single-Leg Balance', 3, 'Supported Single-Leg Balance', 20, 'sec each leg', 'W2 25 s · W3 30 s · W4 2x30 s + test. Fingertips on the rack, hip level.', false);
  perform pg_temp.sx(t, gary, 6, 'Bird Dog', 2, 'Bird Dog', 5, 'reps each side, 10 s holds', 'W3 2x6 · W4 1x6.', false);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength C: Core + full body (Fri)', 2) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Main lift: Bench Press', 3, 'Bench Press', 8, 'reps, RPE 6-7', 'W2-W3 3x8 · W4 2x8. Full grip, straight wrist, feet flat, moderate arch only.', true);
  perform pg_temp.sx(t, gary, 2, 'Pull-Up', 3, 'Pull-Up', 5, 'reps', 'W2 3x6 · W3 3x7 · W4 2x5. Band-assisted or scapular pull-ups if needed. Neutral grip if you have it.', true);
  perform pg_temp.sx(t, gary, 3, 'Inverted Row', 3, 'Inverted Row', 8, 'reps', 'W2 3x10 · W3 3x10 feet further out · W4 2x8. Body straight like a plank.', false);
  perform pg_temp.sx(t, gary, 4, 'Push-Up', 2, 'Push-Up on Handles', 10, 'reps', 'W2 3x10 · W3 3x12 · W4 2x10. Handles keep the wrist neutral.', false);
  perform pg_temp.sx(t, gary, 5, 'Band Face Pull', 2, 'Band Face Pull', 15, 'reps', 'W2-W3 3x15 · W4 2x15. Pull to the forehead, thumbs back.', false);
  perform pg_temp.sx(t, gary, 6, 'Dead Bug', 2, 'Dead Bug', 6, 'reps each side', 'W2 2x8 · W3 3x8 · W4 2x6.', false);
  perform pg_temp.sx(t, gary, 7, 'Modified Side Plank', 1, 'Modified Side Plank (knees)', 3, 'x 10 s holds each side', 'W2 4 · W3 5 · W4 3.', false);

  -- Phase 2: Strength
  insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index, goal_label, kind, start_date, target_exercise, target_value, target_unit)
  values (gary, 'Phase 2', 4, 3, 8000, 'Strength (weeks 5-8, Dec 14 - Jan 10). Resist twisting under load; hinge and squat get strong again. Side planks move to the feet; Pallof presses and carries arrive. Main lifts RPE 7-8. Add load only when every rep was clean and the back stayed 2/10 or less into the next morning. Carries: one 53 lb kettlebell, or a loaded duffel or water jug -- don''t pinch plates by the edge (wrist). Christmas is week 6, New Year''s week 7: if you miss sessions, repeat the week. Same stop rules and hip/knee/wrist rules as Phase 1.', 'planned', 8, 'Strength', 'strength', '2026-12-14', 'Side Plank', 45, 'sec each side')
  returning id into b;
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 1, 'build', 'Side planks on the feet. Pallof and carries start light.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 2, 'build', 'Add reps or band tension where last week was clean.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 3, 'build', 'Heaviest week: RDL and squat drop to sets of 6.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 4, 'benchmark', 'Deload + test: side plank 45 s, Pallof 3 x 10 s holds without a hip shift, suitcase carry 40 m each side at 45+ lb.');
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Side plank 45 s each side on the feet', 'habit', 45, 0);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Pallof 3 x 10 s holds, no hip shift', 'habit', null, 1);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Suitcase carry 40 m each side at 45+ lb', 'habit', 45, 2);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'No back flare for 2 weeks', 'habit', null, 3);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength A: Core + pelvis (Mon)', 0) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'McGill Curl-Up', 3, 'McGill Curl-Up', 6, 'reps, 10 s holds (6, 4, then 2)', 'W7 7-5-3 · W8 5-3-1.', false);
  perform pg_temp.sx(t, gary, 2, 'Side Plank', 3, 'Side Plank (feet)', 20, 'sec each side', 'W6 3x30 s · W7 3x40 s · W8 2x30 s + 45 s test. Straight line, push the floor away.', false);
  perform pg_temp.sx(t, gary, 3, 'Half-Kneeling Pallof Press', 3, 'Half-Kneeling Pallof Press', 8, 'reps each side, 3 s hold', 'W6 3x10 · W7 3x10 heavier band · W8 2x8. Pad under the knee. Press straight out, ribs down, don''t turn.', false);
  perform pg_temp.sx(t, gary, 4, 'Dead Bug', 3, 'Dead Bug (legs extended)', 6, 'reps each side', 'W6-W7 3x8 · W8 2x6.', false);
  perform pg_temp.sx(t, gary, 5, 'Single-Leg Glute Bridge', 3, 'Single-Leg Glute Bridge', 8, 'reps each side', 'W6 3x10 · W7 3x10 with 2 s hold · W8 2x8. Hips level.', false);
  perform pg_temp.sx(t, gary, 6, 'Banded Clamshell', 2, 'Banded Clamshell', 15, 'reps each side', 'W6-W7 3x15 · W8 2x15. Pelvis still.', false);
  perform pg_temp.sx(t, gary, 7, 'Suitcase Carry', 3, 'Suitcase Carry', 20, 'm each side', 'W6 3x30 m · W7 3x40 m · W8 2x40 m + test. Stand tall, shoulders level -- don''t lean.', true);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength B: Hips + posterior chain (Wed)', 1) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Main lift: Barbell RDL', 4, 'Barbell RDL', 8, 'reps', 'W6 4x8 · W7 4x6 heavier · W8 3x6. Rest 2 min. Straps.', true);
  perform pg_temp.sx(t, gary, 2, 'Main lift: Box Squat', 3, 'Box Squat (parallel)', 8, 'reps', 'W6 3x8 · W7 4x6 · W8 2x6. Box at parallel, no lower.', true);
  perform pg_temp.sx(t, gary, 3, 'Barbell Hip Thrust', 3, 'Barbell Hip Thrust', 10, 'reps', 'W6 3x10 · W7 4x8 · W8 2x8.', true);
  perform pg_temp.sx(t, gary, 4, 'Supported Split Squat', 2, 'Supported Split Squat (short range)', 8, 'reps each side', 'W6 3x8 · W7 3x10 · W8 2x8. Hand on the rack, pad under the back knee, stop short of any pinch.', false);
  perform pg_temp.sx(t, gary, 5, 'Copenhagen Plank', 2, 'Short-Lever Copenhagen Plank', 10, 'sec each side', 'W6 2x15 s · W7 3x15 s · W8 2x15 s. Knee on the bench.', false);
  perform pg_temp.sx(t, gary, 6, 'Band Lateral Walk', 2, 'Band Lateral Walk', 12, 'steps each way', 'W6 3x12 · W7 3x15 · W8 2x12.', false);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength C: Core + full body (Fri)', 2) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Main lift: Bench Press', 4, 'Bench Press', 6, 'reps', 'W6 4x6 · W7 4x5 heavier · W8 3x5.', true);
  perform pg_temp.sx(t, gary, 2, 'Pull-Up', 4, 'Pull-Up', 5, 'reps', 'W6 4x6 · W7 4x7 · W8 3x5.', true);
  perform pg_temp.sx(t, gary, 3, 'Inverted Row', 3, 'Inverted Row', 10, 'reps', 'W6 3x10 · W7 3x12 · W8 2x10.', false);
  perform pg_temp.sx(t, gary, 4, 'Tall-Kneeling Pallof Hold', 3, 'Tall-Kneeling Pallof Hold', 20, 'sec each side', 'W6 25 s · W7 30 s · W8 2x20 s.', false);
  perform pg_temp.sx(t, gary, 5, 'Farmer Carry', 3, 'Farmer Carry', 30, 'm', 'W7 3x40 m · W8 2x30 m. Tall, ribs down, short steps.', true);
  perform pg_temp.sx(t, gary, 6, 'Band Face Pull', 3, 'Band Face Pull', 15, 'reps', 'W8 2x15.', false);
  perform pg_temp.sx(t, gary, 7, 'Bird Dog', 2, 'Bird Dog', 6, 'reps each side, 10 s holds', 'W7 2x8 · W8 1x6.', false);

  -- Phase 3: Athletic
  insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index, goal_label, kind, start_date, target_exercise, target_value, target_unit)
  values (gary, 'Phase 3', 4, 3, 8000, 'Athletic (weeks 9-12, Jan 11 - Feb 7). Phase 2 strength in split and single-leg stances; anti-rotation while moving. ROTATION GATE: chop and lift only if (1) the rotation pinch is gone in daily life, including getting out of the car, (2) side plank holds 45 s, and (3) the back has been 2/10 or less for 2 weeks. If any is false, do split-stance Pallof holds in that slot. Landmine without an attachment: barbell end wedged in a towel-wrapped room corner. Same stop rules and hip/knee/wrist rules.', 'planned', 9, 'Athletic', 'strength', '2027-01-11', 'Side Plank', 60, 'sec each side')
  returning id into b;
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 1, 'build', 'Check the rotation gate before the first chop/lift.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 2, 'build', 'Add reps where last week was clean.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 3, 'build', 'Heaviest week of the phase.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 4, 'benchmark', 'Deload + test: side plank 60 s, single-leg balance 30 s each leg, chop/lift pain-free, no rotation pinch in daily life.');
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Side plank 60 s each side', 'habit', 60, 0);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Single-leg balance 30 s each leg', 'habit', 30, 1);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Chop and lift pain-free at full volume', 'habit', null, 2);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'No rotation pinch in daily life', 'habit', null, 3);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength A: Core + pelvis (Mon)', 0) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Side Plank', 3, 'Side Plank (feet)', 45, 'sec each side', 'W10 3x50 s · W11 3x60 s · W12 2x45 s + 60 s test.', false);
  perform pg_temp.sx(t, gary, 2, 'Split-Stance Pallof Press-Out', 3, 'Split-Stance Pallof Press-Out', 8, 'reps each side', 'W10 3x10 · W11 3x10 heavier · W12 2x8. Hips square, front knee over ankle.', false);
  perform pg_temp.sx(t, gary, 3, 'Anti-Rotation Walkout', 3, 'Band Anti-Rotation Walkout', 5, 'reps each side', 'W10 3x6 · W11 3x8 · W12 2x5. Arms locked, step out and back slowly.', false);
  perform pg_temp.sx(t, gary, 4, 'Half-Kneeling Chop (gated)', 2, 'Half-Kneeling Band Chop', 8, 'reps each side', 'Rotation gate first, else split-stance Pallof hold. W10 3x8 · W11 3x10 · W12 2x8. Hips face forward, the upper back turns.', false);
  perform pg_temp.sx(t, gary, 5, 'Half-Kneeling Lift (gated)', 2, 'Half-Kneeling Band Lift', 8, 'reps each side', 'Rotation gate first. W10 3x8 · W11 3x10 · W12 2x8. Tall spine, no rib flare.', false);
  perform pg_temp.sx(t, gary, 6, 'Dead Bug', 2, 'Dead Bug (legs extended)', 8, 'reps each side', 'W10 3x8 · W11 3x10 · W12 2x6.', false);
  perform pg_temp.sx(t, gary, 7, 'Suitcase Carry', 3, 'Suitcase Carry', 30, 'm each side', 'W10 3x40 m · W11 3x40 m heavier · W12 2x30 m.', true);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength B: Hips + posterior chain (Wed)', 1) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Main lift: Barbell RDL', 4, 'Barbell RDL', 6, 'reps', 'W10 4x5 · W11 4x5 heavier · W12 3x5. Rest 2-3 min.', true);
  perform pg_temp.sx(t, gary, 2, 'Single-Leg RDL', 3, 'Single-Leg RDL', 6, 'reps each side', 'W10 3x8 · W11 3x8 add load · W12 2x6. Fingertip support, hips square.', true);
  perform pg_temp.sx(t, gary, 3, 'Main lift: Box Squat', 4, 'Box Squat (parallel)', 6, 'reps', 'W10 4x5 · W11 4x5 heavier · W12 3x5.', true);
  perform pg_temp.sx(t, gary, 4, 'Barbell Hip Thrust', 3, 'Barbell Hip Thrust', 8, 'reps', 'W11 4x8 · W12 2x8.', true);
  perform pg_temp.sx(t, gary, 5, 'Split Squat', 3, 'Split Squat', 8, 'reps each side', 'W11 3x10 · W12 2x8. Unsupported if the knee allows; short range on the left if the hip pinches.', true);
  perform pg_temp.sx(t, gary, 6, 'Copenhagen Plank', 2, 'Short-Lever Copenhagen Plank', 20, 'sec each side', 'W10 3x20 s · W11 3x25 s · W12 2x20 s.', false);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength C: Core + full body (Fri)', 2) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Main lift: Bench Press', 4, 'Bench Press', 5, 'reps', 'W10 4x5 · W11 5x4 heavier · W12 3x5.', true);
  perform pg_temp.sx(t, gary, 2, 'Pull-Up', 4, 'Pull-Up', 6, 'reps', 'W10 4x7 · W11 4x8 · W12 3x6.', true);
  perform pg_temp.sx(t, gary, 3, 'Half-Kneeling Landmine Press', 3, 'Half-Kneeling Landmine Press', 8, 'reps each side', 'W11 3x10 · W12 2x8. Ribs down, press up and forward.', true);
  perform pg_temp.sx(t, gary, 4, 'Inverted Row', 3, 'Inverted Row', 10, 'reps', 'W10 3x12 · W11 3x12 feet raised · W12 2x10.', false);
  perform pg_temp.sx(t, gary, 5, 'Single-Leg Balance', 3, 'Single-Leg Balance (eyes closed)', 20, 'sec each leg', 'W10 25 s · W11 30 s · W12 2x30 s + test.', false);
  perform pg_temp.sx(t, gary, 6, 'Farmer Carry', 3, 'Farmer Carry', 40, 'm', 'W11 heavier · W12 2x30 m.', true);
  perform pg_temp.sx(t, gary, 7, 'Band Face Pull', 2, 'Band Face Pull', 15, 'reps', null, false);

  -- Phase 4: Golf readiness
  insert into fit_blocks (user_id, name, week_count, sessions_per_week, step_goal, care_notes, status, order_index, goal_label, kind, start_date, target_exercise, target_value, target_unit)
  values (gary, 'Phase 4', 4, 3, 8000, 'Golf readiness (weeks 13-16, Feb 8 - Mar 7). Load rotation on purpose, then add speed. The turn comes from the hips and upper back together over a still, braced low back. Kneeling -> half-kneeling -> standing only after 2 pain-free sessions at the level below. Throws start at 50% and build 10-15% a week. Sim drills after Mon/Fri lifts: lead-foot flare 20-30 deg, pump drill, feet-together swings, step drill, 3 s finish hold. Exit: all earlier tests still pass and Stage 4 golf tolerated for 2 weeks. Same stop rules.', 'planned', 10, 'Golf readiness', 'power', '2027-02-08', 'Med-Ball Rotational Throw', 75, '% effort, pain-free')
  returning id into b;
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 1, 'build', 'Tall-kneeling rotations, throws at 50%.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 2, 'build', 'Half-kneeling rotations, throws at 60%.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 3, 'build', 'Standing rotations, throws at 70-75%.');
  insert into fit_block_weeks (block_id, user_id, week_number, phase, notes) values (b, gary, 4, 'benchmark', 'Deload + re-test everything. Golf at Stage 4 for 2 weeks = done.');
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Every earlier test still passes', 'habit', null, 0);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Stage 4 golf for 2 weeks with no flare', 'habit', 4, 1);
  insert into fit_block_goals (block_id, user_id, title, metric, target, order_index) values (b, gary, 'Throws at 75% effort, pain-free', 'habit', 75, 2);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength A: Rotation + core (Mon)', 0) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.wx(s, gary, 4, 'Practice Swings', 5, 'slow swings', '30% building to 50%, hold every finish');
  perform pg_temp.sx(t, gary, 1, 'Landmine Rotation', 3, 'Landmine Rotation', 6, 'reps each side', 'W13 tall-kneeling · W14 half-kneeling · W15 3x8 standing · W16 2x6 standing. Arms long, hips and chest turn together; pivot the feet when standing.', true);
  perform pg_temp.sx(t, gary, 2, 'Med-Ball Rotational Throw', 3, 'Med-Ball Rotational Throw', 5, 'throws each side', 'W13 50% half-kneeling · W14 60% · W15 4x5 at 70-75% standing · W16 3x5 at 75%. Hips start, arms last.', false);
  perform pg_temp.sx(t, gary, 3, 'Split-Stance Band Chop', 3, 'Split-Stance Band Chop', 8, 'reps each side', 'W15 3x10 · W16 2x8.', false);
  perform pg_temp.sx(t, gary, 4, 'Side Plank', 2, 'Side Plank (feet)', 45, 'sec each side', 'W14 2x60 s · W15 3x60 s · W16 2x45 s.', false);
  perform pg_temp.sx(t, gary, 5, 'Pallof Press-Out', 2, 'Standing Pallof Press-Out', 10, 'reps each side', 'W16 2x8.', false);
  perform pg_temp.sx(t, gary, 6, 'Suitcase Carry', 3, 'Suitcase Carry', 40, 'm each side', 'W16 2x40 m.', true);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength B: Hips + posterior chain (Wed)', 1) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.sx(t, gary, 1, 'Main lift: Barbell RDL', 3, 'Barbell RDL', 5, 'reps', 'W15 heavier · W16 2x5.', true);
  perform pg_temp.sx(t, gary, 2, 'Main lift: Box Squat', 3, 'Box Squat (parallel)', 5, 'reps', 'W15 heavier · W16 2x5.', true);
  perform pg_temp.sx(t, gary, 3, 'Single-Leg RDL', 3, 'Single-Leg RDL', 8, 'reps each side', 'W15 heavier · W16 2x6.', true);
  perform pg_temp.sx(t, gary, 4, 'Low Step-Up', 3, 'Low Step-Up (8-12 in box)', 8, 'reps each side', 'W15 3x10 · W16 2x8. Whole foot on the box, drive through the heel.', true);
  perform pg_temp.sx(t, gary, 5, 'Barbell Hip Thrust', 3, 'Barbell Hip Thrust', 8, 'reps', 'W15 3x6 heavier · W16 2x8.', true);
  perform pg_temp.sx(t, gary, 6, 'Copenhagen Plank', 2, 'Short-Lever Copenhagen Plank', 25, 'sec each side', 'W15 2x30 s · W16 2x20 s.', false);
  insert into fit_session_templates (block_id, user_id, name, order_index) values (b, gary, 'Strength C: Full body + speed (Fri)', 2) returning id into t;
  insert into fit_block_sections (session_template_id, user_id, title, set_count, order_index) values (t, gary, 'Warm-up', 1, 0) returning id into s;
  perform pg_temp.wx(s, gary, 0, '90/90 Breathing', 5, 'slow breaths', 'Feet on the wall, exhale fully, ribs down');
  perform pg_temp.wx(s, gary, 1, 'Cat-Cow', 8, 'reps', 'Slow, one segment at a time');
  perform pg_temp.wx(s, gary, 2, 'Bird Dog', 5, 'reps each side', 'Reach long, hips still');
  perform pg_temp.wx(s, gary, 3, 'Glute Bridge', 10, 'reps', 'Ribs down, squeeze 2 s');
  perform pg_temp.wx(s, gary, 4, 'Practice Swings', 5, 'slow swings', '30% building to 50%, hold every finish');
  perform pg_temp.sx(t, gary, 1, 'Med-Ball Step-Behind Throw', 3, 'Med-Ball Step-Behind Throw', 4, 'throws each side', 'W13 60% · W14 70% · W15 4x4 at 75-80% · W16 3x4. Step, never jump.', false);
  perform pg_temp.sx(t, gary, 2, 'Main lift: Bench Press', 3, 'Bench Press', 5, 'reps', 'W15 heavier · W16 2x5.', true);
  perform pg_temp.sx(t, gary, 3, 'Pull-Up', 3, 'Pull-Up', 6, 'reps', 'W14-W15 3x8 · W16 2x6.', true);
  perform pg_temp.sx(t, gary, 4, 'Half-Kneeling Landmine Press', 3, 'Half-Kneeling Landmine Press', 8, 'reps each side', 'W16 2x8.', true);
  perform pg_temp.sx(t, gary, 5, 'Inverted Row', 3, 'Inverted Row', 10, 'reps', 'W15 3x12 · W16 2x10.', false);
  perform pg_temp.sx(t, gary, 6, 'Farmer Carry', 2, 'Farmer Carry', 40, 'm', 'W15 3x40 m · W16 2x40 m.', true);

  -- Daily routine
  update fit_routine_items set days_of_week = '{1}'::smallint[], title = 'Lift: Strength A (core + pelvis)', template_index = 0, detail = '35-45 min. The program''s Monday session; open it from here. 20 oz water during.' where id = '0e52e637-84b6-4146-9f3a-934bc5b762a3' and user_id = gary;
  update fit_routine_items set days_of_week = '{3}'::smallint[], title = 'Lift: Strength B (hips + posterior chain)', template_index = 1, detail = '40-50 min. The program''s Wednesday session. 20 oz water during.' where id = 'c03acf92-189b-4ee2-880b-e3ec2bafee15' and user_id = gary;
  update fit_routine_items set days_of_week = '{0,1,2,3,4,5,6}'::smallint[], title = 'Mobility: daily 10 min', detail = '10 min, every day (after the lift Mon/Wed/Fri, at 3:30 Tue/Thu, as the warm-up Saturday): 90/90 breathing x5, cat-cow x8, T-spine extension on the roller 6 x 3 spots, open book 8/side (pillow between knees), quadruped T-spine rotation 8/side (hips over knees), half-kneeling hip flexor stretch 2x30 s/side on a pad, figure-4 30 s/side (left: stop short of any groin pinch), pelvic tilts x10, glute bridge x10. Nothing should pinch. Skipped on purpose: forced 90/90, deep squat holds, child''s pose, knees-to-floor twists.' where id = 'ff37c139-4619-47da-8ba0-881008a33aad' and user_id = gary;
  update fit_routine_items set days_of_week = '{2,4}'::smallint[], time_of_day = '15:30', title = 'Mobility plus (20 min)', detail = 'Daily mobility, then +10 min: side-lying thoracic rotation 2x5 breaths each side, band hamstring stretch 2x30 s each leg, right-hip 90/90 (good side, gentle) 2x30 s, wall slides 2x10. Then the 30-40 min dog walk at 5:30.', remind = true, order_index = 8 where id = '7e89aa8e-3d29-4adf-8cb4-40b68c04caf3' and user_id = gary;
  update fit_routine_items set days_of_week = '{}'::smallint[] where id = '16ed57c7-0ecf-4356-abbc-207c1540a193' and user_id = gary;
  update fit_routine_items set days_of_week = '{}'::smallint[] where id = '4461f42c-384f-4668-a5fe-0561a2abdd3a' and user_id = gary;
  update fit_routine_items set days_of_week = '{}'::smallint[] where id = '5cba4d43-c1e5-43f7-8a50-41e4b2965862' and user_id = gary;
  update fit_routine_items set days_of_week = '{}'::smallint[] where id = '38c27478-b40d-417c-a9df-5fcc47abe64c' and user_id = gary;
  update fit_routine_items set time_of_day = '16:45', title = 'Sim: short game (optional)', remind = false, order_index = 10, detail = 'Putting and wedges to 40 yd -- always allowed, even on a sore day. Golfable first if you like.' where id = 'af1969d5-1f37-48d7-913b-3b93cf7515c5' and user_id = gary;
  update fit_routine_items set title = 'Sim: swing at your golf stage', detail = 'Golfable (20 min), then full swing capped by your return-to-play stage (Stage 2: 50-60%, wedges-7i, 40 balls; Stage 3: 75%, 60 balls; Stage 4: 85-90%, 80 balls). 10 slow practice swings first.' where id = '0ca1d987-abe3-490f-8dce-d1805676cc6b' and user_id = gary;
  update fit_routine_items set title = 'Sim: 9 holes at your golf stage', detail = 'Golfable (10 min), then 9 holes at your stage''s effort: middle of greens, take your medicine after bad drives. Hold every finish 3 s.' where id = 'e3574c54-b400-4488-8154-64b746d52409' and user_id = gary;
  update fit_routine_items set days_of_week = '{1,3,5}'::smallint[] where id = '62f858e7-7840-4736-9f95-9df2d0c8a488' and user_id = gary;
  update fit_routine_items set days_of_week = '{1,2,3,4,5}'::smallint[] where id = '280045ec-b3f2-4da2-8729-41ebfd3333b8' and user_id = gary;
  update fit_routine_items set detail = 'Play at your return-to-play stage. Daily mobility as the warm-up, then 10 practice swings building to your stage''s effort. Putting Golfable on the practice green. Track fairways, GIR, putts, penalties and doubles. Push cart or double strap if you walk.' where id = 'c533cfe1-8dcd-431d-8aa8-aba7f0dc3241' and user_id = gary;
  update fit_routine_items set detail = '15 min: weigh-in average, workouts, steps, sleep, Saturday''s leak, and the back / hip / rotation / golf-stage tracker.' where id = 'e3c3ab75-bdff-44c3-a701-45c33333eaf4' and user_id = gary;
  insert into fit_routine_items (user_id, days_of_week, time_of_day, title, detail, kind, template_index, remind, order_index)
  values (gary, '{5}', '15:30', 'Lift: Strength C (core + full body)', '40-50 min. The program''s Friday session. 20 oz water during.', 'lift', 2, true, 8);

  -- Planned workout days: Mon/Wed/Fri for 16 weeks; Tue/Thu from Nov 17 on go away.
  delete from fit_workout_plans where user_id = gary and planned_date >= '2026-11-17' and extract(isodow from planned_date) in (2, 4);
  insert into fit_workout_plans (user_id, planned_date)
  select gary, d::date from generate_series('2026-11-16'::date, '2027-03-05'::date, interval '1 day') d
  where extract(isodow from d) in (1, 3, 5)
  on conflict (user_id, planned_date) do nothing;

  update fit_profiles set injuries = 'Left low back: recurring pain at the QL / outer back of the left iliac crest; pinch on left rotation (including getting out of the car); flares after hard swings or heavy lifting. Left hip: pinned in 7th grade (likely SCFE, unconfirmed) -- internal rotation is restricted and structural; never force IR or deep hip flexion. Left knee: minor meniscus injury -- no running, sprinting, or jumping. Wrist: much better, but still be careful around it.'
  where user_id = gary;
end;
$$;

commit;

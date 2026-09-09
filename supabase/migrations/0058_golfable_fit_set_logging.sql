-- Golfable Fit, part 3: per-set logging with a real rep/time count instead
-- of a free-text field.
--
-- fit_block_exercises gains target_count/unit (e.g. 12 + "reps", or
-- 20 + "sec each side") split out of what used to be one prescription
-- string, so the runner screen can drive a real +/- stepper on the number
-- instead of editing text. fit_exercise_logs gains set_number, so a
-- 3-set circuit produces 3 loggable rows per exercise instead of 1 --
-- "log each set as you go through it" -- and actual_count replaces the
-- old free-text actual_prescription for the same reason.

alter table fit_block_exercises add column if not exists target_count integer;
alter table fit_block_exercises add column if not exists unit text;

update fit_block_exercises set target_count = 6, unit = 'reps' where name = 'Cat/Cow' and target_count is null;
update fit_block_exercises set target_count = 4, unit = 'reps each side' where name = 'T-Rotation from Table Top' and target_count is null;
update fit_block_exercises set target_count = 12, unit = 'reps' where name = 'TRX Row' and target_count is null;
update fit_block_exercises set target_count = 20, unit = 'sec each side' where name = 'TRX Assisted Reverse Lunge Hold' and target_count is null;
update fit_block_exercises set target_count = 6, unit = 'reps (5 sec each)' where name = 'Decline TRX Assisted Squat' and target_count is null;
update fit_block_exercises set target_count = 10, unit = 'reps' where name = 'TRX Push-Up' and target_count is null;
update fit_block_exercises set target_count = 6, unit = 'reps each arm' where name = 'Single-Arm TRX Rotational Row' and target_count is null;
update fit_block_exercises set target_count = 20, unit = 'sec' where name = 'Hard-Style Plank' and target_count is null;
update fit_block_exercises set target_count = 20, unit = 'sec' where name = 'Pike Hold' and target_count is null;
update fit_block_exercises set target_count = 5, unit = 'reps each side' where name = 'Stick Reverse Lunge Hold w/ Contralateral Rotation' and target_count is null;
-- Foam Roll keeps target_count/unit null -- it's a single untimed round,
-- not a rep target, so it gets no stepper.

alter table fit_exercise_logs add column if not exists set_number integer not null default 1;
alter table fit_exercise_logs add column if not exists actual_count integer;

-- The old (workout_log_id, exercise_id) constraint would block inserting
-- set 2+ rows below -- drop it before the backfill, replace it after with
-- one that includes set_number.
alter table fit_exercise_logs drop constraint if exists fit_exercise_logs_workout_log_id_exercise_id_key;

-- Every log row seeded before this migration is effectively "set 1" --
-- give it its missing sibling rows for sections with more than one set,
-- so an in-progress session picks up the rest of its circuit instead of
-- only ever showing set 1.
do $$
declare
  r record;
begin
  for r in
    select el.workout_log_id, el.exercise_id, el.user_id, el.order_index, s.set_count
    from fit_exercise_logs el
    join fit_block_exercises e on e.id = el.exercise_id
    join fit_block_sections s on s.id = e.section_id
    where el.set_number = 1 and s.set_count > 1
  loop
    insert into fit_exercise_logs (workout_log_id, exercise_id, user_id, order_index, set_number)
    select r.workout_log_id, r.exercise_id, r.user_id, r.order_index, gs
    from generate_series(2, r.set_count) as gs;
  end loop;
end $$;

alter table fit_exercise_logs drop column if exists actual_prescription;
alter table fit_exercise_logs add constraint fit_exercise_logs_workout_log_id_exercise_id_set_number_key
  unique (workout_log_id, exercise_id, set_number);

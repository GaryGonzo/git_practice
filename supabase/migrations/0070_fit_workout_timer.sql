-- Golfable Fit: opening a workout no longer starts its clock.
-- timer_started_at is set when the player taps "Start workout" (or checks
-- off a first set). Until then the workout can be read without a running
-- timer. Existing workouts count as started when they were created.
alter table fit_workout_logs add column if not exists timer_started_at timestamptz;
update fit_workout_logs set timer_started_at = started_at where timer_started_at is null;

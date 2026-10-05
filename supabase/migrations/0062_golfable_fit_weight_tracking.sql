-- Golfable Fit: weight tracking for loaded lifts. A 5x5-style block needs
-- to log actual weight per set, not just reps -- tracks_weight marks which
-- exercises show a weight field at all (the barbell lifts and any loaded
-- accessory), while target_weight_lbs stays null by default so the player
-- picks their own starting weight and ramps it up themselves rather than
-- the app suggesting one.

alter table fit_block_exercises add column if not exists tracks_weight boolean not null default false;
alter table fit_block_exercises add column if not exists target_weight_lbs numeric;

alter table fit_exercise_logs add column if not exists actual_weight_lbs numeric;

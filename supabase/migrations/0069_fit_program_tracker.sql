-- Golfable Fit: the 16-week golf strength & mobility program.
--  * Blocks can be "archived": set aside without being deleted (Blocks 5-6
--    when the 16-week program replaced them). No screen reads archived
--    blocks -- the app only asks for active, planned or completed ones.
--  * The Sunday check-in gains the weekly progress tracker: back pain
--    (average and worst, 0-10), left-hip and rotation comfort (0-10),
--    side plank seconds each side, mobility days, golf return-to-play
--    stage (1-5), next-morning back after golf (0-10), recovery (1-5) and
--    whether the week had a flare.

alter table fit_blocks drop constraint if exists fit_blocks_status_check;
alter table fit_blocks add constraint fit_blocks_status_check
  check (status in ('active', 'completed', 'planned', 'archived'));

alter table fit_weekly_checkins
  add column if not exists back_pain_avg smallint check (back_pain_avg between 0 and 10),
  add column if not exists back_pain_worst smallint check (back_pain_worst between 0 and 10),
  add column if not exists hip_comfort smallint check (hip_comfort between 0 and 10),
  add column if not exists rotation_comfort smallint check (rotation_comfort between 0 and 10),
  add column if not exists side_plank_left_s smallint check (side_plank_left_s between 0 and 600),
  add column if not exists side_plank_right_s smallint check (side_plank_right_s between 0 and 600),
  add column if not exists mobility_days smallint check (mobility_days between 0 and 7),
  add column if not exists golf_stage smallint check (golf_stage between 1 and 5),
  add column if not exists golf_next_morning_back smallint check (golf_next_morning_back between 0 and 10),
  add column if not exists recovery smallint check (recovery between 1 and 5),
  add column if not exists flare boolean;

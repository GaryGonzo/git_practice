-- Randomizes which driver drill occupies each of the 3 Monday slots in the
-- daily_golfable calendar, drawing from the full driver-category pool (now
-- 18 drills after 0035) instead of the original fixed 3. The calendar is a
-- repeating 3-week block (see 0016/0024/0025) that gets shifted forward in
-- time whenever it's recycled -- so this changes which 3 of the 18 are in
-- rotation, not a live per-occurrence random draw.

update daily_golfable set drill_id = 'distance-control-wood' where date = '2026-08-24';
update daily_golfable set drill_id = 'face-control-wood' where date = '2026-08-31';
update daily_golfable set drill_id = 'sweet-spot-wood' where date = '2026-09-07';

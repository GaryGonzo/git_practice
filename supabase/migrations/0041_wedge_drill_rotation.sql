-- Puts the 16 new Wedges drills from 0040 into rotation on the Tue/Thu/Fri
-- "wedges" slots of the daily_golfable calendar, replacing the old fixed
-- 4-drill pattern (landing-zone / up-and-down / pitch-and-chip / sand-save).
--
-- Same approach as the Irons rotation in 0039: wedges only occupy some
-- Tue/Thu/Fri slots (4 per existing 3-week A/B/C block), so this cycles by
-- *wedge-slot count* rather than week count -- every 16 wedge slots is one
-- random pass through all 16 drills once each, then a fresh pass begins.
--
-- Leaves history (on/before 2026-08-30, already played or in progress)
-- untouched and starts at the next wedge slot, 2026-09-01. The calendar is
-- currently only populated through 2026-12-18 (see 0037/0039), which
-- covers one full 16-slot pass plus the first 6 slots of a second pass.
-- Continuing the rotation past 2026-12-18 needs another migration like
-- this one, same as the driver and iron cycles.

update daily_golfable set drill_id = 'face-control-wedges-multi' where date = '2026-09-01';
update daily_golfable set drill_id = 'ladder-drill' where date = '2026-09-04';
update daily_golfable set drill_id = 'ground-contact-wedge' where date = '2026-09-10';
update daily_golfable set drill_id = 'swing-clock-wedges' where date = '2026-09-17';
update daily_golfable set drill_id = 'throwing-darts' where date = '2026-09-22';
update daily_golfable set drill_id = 'sweet-spot-wedge' where date = '2026-09-25';
update daily_golfable set drill_id = 'ground-contact-wedges-multi' where date = '2026-10-01';
update daily_golfable set drill_id = 'alternating-target' where date = '2026-10-08';
update daily_golfable set drill_id = 'hole-out' where date = '2026-10-13';
update daily_golfable set drill_id = 'sand-escape-long' where date = '2026-10-16';
update daily_golfable set drill_id = 'swing-clock-wedge' where date = '2026-10-22';
update daily_golfable set drill_id = 'sand-escape' where date = '2026-10-29';
update daily_golfable set drill_id = 'sweet-spot-wedges-multi' where date = '2026-11-03';
update daily_golfable set drill_id = 'pitch-chip-run' where date = '2026-11-06';
update daily_golfable set drill_id = 'face-control-wedge' where date = '2026-11-12';
update daily_golfable set drill_id = 'buried' where date = '2026-11-19';

-- Second pass begins here (fresh random order, first 6 of 16).
update daily_golfable set drill_id = 'ladder-drill' where date = '2026-11-24';
update daily_golfable set drill_id = 'sweet-spot-wedges-multi' where date = '2026-11-27';
update daily_golfable set drill_id = 'ground-contact-wedge' where date = '2026-12-03';
update daily_golfable set drill_id = 'ground-contact-wedges-multi' where date = '2026-12-10';
update daily_golfable set drill_id = 'alternating-target' where date = '2026-12-15';
update daily_golfable set drill_id = 'sand-escape-long' where date = '2026-12-18';

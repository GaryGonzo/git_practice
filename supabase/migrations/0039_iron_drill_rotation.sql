-- Puts the 15 new Irons drills from 0038 into rotation on the Tue/Thu/Fri
-- "irons" slots of the daily_golfable calendar, replacing the old fixed
-- 5-drill pattern (the-approach / fairway-accuracy / par-3-simulator /
-- shot-shape-challenge / proximity-test).
--
-- Unlike Driver -- which only lives on Monday, so "N weeks" and "N slots"
-- are the same thing -- irons only get an iron slot on some Tue/Thu/Fri
-- days (the other slots go to wedges), 5 iron slots per existing 3-week
-- A/B/C block. So this cycles by *iron-slot count*, not week count: every
-- 15 iron slots (= 3 repeats of the 3-week block) is one pass through all
-- 15 drills once each, in random order, then a fresh random pass begins.
--
-- Leaves history (on/before 2026-08-30, already played or in progress)
-- untouched and starts at the next iron slot, 2026-09-03. The calendar is
-- currently only populated through 2026-12-18 (see 0037), which covers one
-- full 15-slot pass plus the first 11 slots of a second pass. Continuing
-- the rotation past 2026-12-18 needs another migration like this one, same
-- as the driver cycle.

update daily_golfable set drill_id = 'green-hunting-iron' where date = '2026-09-03';
update daily_golfable set drill_id = 'max-distance-iron' where date = '2026-09-08';
update daily_golfable set drill_id = 'sweet-spot-irons-multi' where date = '2026-09-11';
update daily_golfable set drill_id = 'face-control-iron' where date = '2026-09-15';
update daily_golfable set drill_id = 'ground-contact-irons-multi' where date = '2026-09-18';
update daily_golfable set drill_id = 'max-distance-irons-multi' where date = '2026-09-24';
update daily_golfable set drill_id = 'distance-control-irons-clubs' where date = '2026-09-29';
update daily_golfable set drill_id = 'ground-contact-iron' where date = '2026-10-02';
update daily_golfable set drill_id = 'sweet-spot-iron' where date = '2026-10-06';
update daily_golfable set drill_id = 'distance-control-irons-distance' where date = '2026-10-09';
update daily_golfable set drill_id = 'par-3s' where date = '2026-10-15';
update daily_golfable set drill_id = 'the-punch' where date = '2026-10-20';
update daily_golfable set drill_id = 'green-hunting-irons-multi' where date = '2026-10-23';
update daily_golfable set drill_id = 'the-flyer' where date = '2026-10-27';
update daily_golfable set drill_id = 'face-control-irons-multi' where date = '2026-10-30';

-- Second pass begins here (fresh random order, first 10 of 15).
update daily_golfable set drill_id = 'par-3s' where date = '2026-11-05';
update daily_golfable set drill_id = 'face-control-iron' where date = '2026-11-10';
update daily_golfable set drill_id = 'sweet-spot-iron' where date = '2026-11-13';
update daily_golfable set drill_id = 'distance-control-irons-clubs' where date = '2026-11-17';
update daily_golfable set drill_id = 'distance-control-irons-distance' where date = '2026-11-20';
update daily_golfable set drill_id = 'sweet-spot-irons-multi' where date = '2026-11-26';
update daily_golfable set drill_id = 'ground-contact-iron' where date = '2026-12-01';
update daily_golfable set drill_id = 'green-hunting-irons-multi' where date = '2026-12-04';
update daily_golfable set drill_id = 'the-punch' where date = '2026-12-08';
update daily_golfable set drill_id = 'max-distance-irons-multi' where date = '2026-12-11';
update daily_golfable set drill_id = 'green-hunting-iron' where date = '2026-12-17';

-- Puts the 15 Putter drills (the-gate, putting-ladder, and the 13 new/
-- replaced ones from 0042) into rotation on the Wednesday "putter" slot of
-- the daily_golfable calendar, replacing the old fixed 3-drill pattern.
--
-- Putter only lives on Wednesday -- one slot per week, same as Driver's
-- Monday-only pattern -- so this cycles by week count directly: 15 drills,
-- 15 weeks, each drill once in random order, then a fresh random pass
-- begins.
--
-- Leaves history (on/before 2026-08-30, already played) untouched and
-- starts at the next Wednesday, 2026-09-02. The calendar is currently only
-- populated through 2026-12-16, which covers one full 15-week pass plus
-- the first slot of a second pass. Continuing the rotation past
-- 2026-12-16 needs another migration like this one, same as the driver,
-- iron, and wedge cycles.
--
-- Content is now on a randomized cycling rotation across all four
-- categories (Driver/Monday, Irons+Wedges/Tue-Thu-Fri, Putter/Wednesday),
-- with enough drills in each pool that nothing repeats for months.

update daily_golfable set drill_id = 'no-3-putts' where date = '2026-09-02';
update daily_golfable set drill_id = 'twenty-one' where date = '2026-09-09';
update daily_golfable set drill_id = 'fives' where date = '2026-09-16';
update daily_golfable set drill_id = 'horse-pig' where date = '2026-09-23';
update daily_golfable set drill_id = 'putting-ladder' where date = '2026-09-30';
update daily_golfable set drill_id = 'step-back-ladder' where date = '2026-10-07';
update daily_golfable set drill_id = 'putter-gate' where date = '2026-10-14';
update daily_golfable set drill_id = '4-ball' where date = '2026-10-21';
update daily_golfable set drill_id = 'up-and-down' where date = '2026-10-28';
update daily_golfable set drill_id = 'consecutive-putts-controlled' where date = '2026-11-04';
update daily_golfable set drill_id = '18-holes' where date = '2026-11-11';
update daily_golfable set drill_id = 'reverse-ladder' where date = '2026-11-18';
update daily_golfable set drill_id = 'around-the-world' where date = '2026-11-25';
update daily_golfable set drill_id = 'the-gate' where date = '2026-12-02';
update daily_golfable set drill_id = 'putter-ball-gate' where date = '2026-12-09';

-- Second pass begins here (fresh random order, first 1 of 15).
update daily_golfable set drill_id = 'horse-pig' where date = '2026-12-16';

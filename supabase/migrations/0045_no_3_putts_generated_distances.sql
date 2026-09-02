-- No 3 Putts' setup copy used to describe distances vaguely ("4 to 30
-- feet -- 2 really long, 2 shorter, most in the 12-20 foot range") and
-- didn't match reality well. The app now generates the 18 hole distances
-- itself (deterministic per date, shared with 18 Holes) and renders them
-- directly in the Setup card, so this text just needs to point at that
-- list instead of describing footage on its own.
update drills
set setup_description = 'Simulate 18 "holes" of putts, one at each of the distances below. This simulates real putting during a round.'
where id = 'no-3-putts';

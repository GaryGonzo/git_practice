-- Short game had no signal at all in the round tracker -- Up and Down
-- (did you get it up and down after missing the green) is the standard
-- scrambling stat, and only meaningful on a hole where the green was
-- actually missed. Maps cleanly onto the "Up and Down" Golfable's own
-- rubric, same as No 3 Putts / 18 Holes / Fairway Finder already do.

alter table round_holes add column if not exists up_and_down boolean;

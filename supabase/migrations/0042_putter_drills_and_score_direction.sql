-- Adds 11 Putter drills (2 in-place replacements of existing drills, 9
-- new) and, along the way, adds real support for "fewer is better"
-- scoring (Hole Out and the new 18 Holes both count strokes/putts, where
-- a lower number wins -- the opposite of every other drill's points).
--
-- score_direction lets the app compare/sort/display a drill's scores
-- correctly regardless of which way is better, instead of the one-off
-- points-formula workaround Hole Out originally shipped with in 0040.
-- Existing rows default to 'higher', which is every drill added before
-- this migration -- no behavior changes for them.
alter table drills add column score_direction text not null default 'higher'
  check (score_direction in ('higher', 'lower'));

-- Hole Out (0040) now stores the real stroke count instead of a synthetic
-- "16 minus strokes" score. No scores have been logged against it yet, so
-- there's nothing to backfill.
update drills set
  rules_description = 'Play 3 rounds -- each round is one hole-out attempt from a fresh spot. Your score is the number of strokes it took to hole out (fewer is better). Record your best round as your score.',
  rules_scoring = array['Score = strokes taken to hole out (fewer is better)', '3 rounds total -- best (lowest) round counts'],
  target_scratch = '5', target_low = '9', target_mid = '12', target_high = '15',
  max_score = 30,
  score_direction = 'lower'
where id = 'hole-out';

-- Step-Back Ladder is replaced in place by Consecutive Putts - Increasing
-- Distance (tighter start/increment, best-of-3 instead of a single
-- attempt). Only 1 score was ever logged against it, so the in-place
-- replace is safe, same as max-distance in 0035.
update drills set
  name = 'Consecutive Putts - Increasing Distance',
  setup_description = 'Find a flat line with as little break as possible. Start 3 feet from the hole.',
  setup_equipment = array['Putter', 'Several golf balls'],
  rules_description = 'Make it, then move back 1 foot and putt again -- keep going until you miss. 3 attempts. Record your best attempt as your score.',
  rules_scoring = array['Score = the farthest distance (in feet) of the last putt you made before missing', '3 attempts total -- best attempt counts'],
  target_scratch = '15/20', target_low = '12/20', target_mid = '10/20', target_high = '8/20',
  max_score = 20
where id = 'step-back-ladder';

-- Up and Down is replaced in place by the 5-spot wedge-and-putter version
-- pitched alongside the rest of the Putter batch -- moves from Wedges to
-- Putter. No scores or calendar slots reference the old wedges version,
-- so nothing else needs updating.
update drills set
  name = 'Up and Down',
  category = 'putter',
  setup_description = 'Pick 5 different spots around the green, each a realistic up-and-down chance.',
  setup_equipment = array['Wedge', 'Putter', '25 golf balls'],
  rules_description = 'Each round, play all 5 spots -- one attempt per spot, getting up and down in 2 strokes (1 chip/pitch + 1 putt) for a point. 5 rounds. Record your best round as your score.',
  rules_scoring = array['1 point per spot where you get up and down in 2 strokes', '5 spots per round, 5 rounds total -- best round counts'],
  target_scratch = '4/5', target_low = '4/5', target_mid = '3/5', target_high = '2/5',
  max_score = 5
where id = 'up-and-down';

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score, score_direction
) values
  (
    'consecutive-putts-controlled', 'Consecutive Putts - Controlled Distance', 'putter',
    'Find a flat line with as little break as possible. Set up 8 feet from the hole.',
    array['Putter', 'Several golf balls'],
    'Putt until you miss -- no cap on attempts. 3 attempts. Record your best attempt as your score.',
    array['Score = number of putts made in a row before your first miss', '3 attempts total -- best attempt counts'],
    '16/20', '12/20', '8/20', '4/20', 20, 'higher'
  ),
  (
    'around-the-world', 'Around the World', 'putter',
    'Place 6 balls in a circle, each 5 feet from the hole.',
    array['Putter', '6 golf balls'],
    'Putt each ball in order around the circle. A completed lap is all 6 holed without a miss -- keep doing laps until you miss. 3 attempts. Record your best attempt as your score.',
    array['Score = number of complete laps before a miss', '3 attempts total -- best attempt counts'],
    '10/15', '5/15', '3/15', '1/15', 15, 'higher'
  ),
  (
    'putter-gate', 'Putter Gate', 'putter',
    'Set two tees just 1/2" wider than your putter head, positioned so the putter head swings cleanly through them. Putt from 4 feet.',
    array['Putter', '2 tees', '30 golf balls'],
    '10 putts per round. Play 3 rounds. Record your best round as your score.',
    array['1 point per made putt', '10 putts per round, 3 rounds total -- best round counts'],
    '10/10', '8/10', '5/10', '3/10', 10, 'higher'
  ),
  (
    'putter-ball-gate', 'Putter and Ball Gate', 'putter',
    'Same as Putter Gate, plus a second gate for the ball itself -- two tees 1" wider than the ball, set 3-6" in front of it, with the putter gate still at the impact position. Putt from 4 feet.',
    array['Putter', '4 tees', '30 golf balls'],
    '10 putts per round. Play 3 rounds. Record your best round as your score.',
    array['1 point per made putt', '10 putts per round, 3 rounds total -- best round counts'],
    '10/10', '8/10', '5/10', '3/10', 10, 'higher'
  ),
  (
    'no-3-putts', 'No 3 Putts', 'putter',
    'Simulate 18 "holes" from various starting points, 4 to 30 feet -- 2 really long, 2 shorter, most in the 12-20 foot range. This simulates real putting during a round.',
    array['Putter', '18 golf balls'],
    'One putt per hole to start; keep putting out. One pass through all 18 holes.',
    array['2 points for a 1-putt', '1 point for a 2-putt', '0 points for 3 or more putts', '18 holes, one pass'],
    '25/36', '20/36', '15/36', '10/36', 36, 'higher'
  ),
  (
    '18-holes', '18 Holes', 'putter',
    'Same 18 simulated holes as No 3 Putts (same session -- log both scores from one pass). This time the goal is finishing in as few total putts as possible.',
    array['Putter'],
    'One pass through the same 18 holes. Your score is the total number of putts taken (fewer is better).',
    array['Score = total putts across all 18 holes (fewer is better)', '18 holes, one pass'],
    '28', '30', '36', '44', 60, 'lower'
  ),
  (
    'horse-pig', 'Horse/Pig', 'putter',
    'Play with a partner, or by yourself using Ball A and Ball B. Putt from anywhere -- closest to the hole is safe, the farthest gets a letter (both are safe on a tie). Play until someone spells out the word (HORSE or PIG).',
    array['Putter', '2 golf balls (if playing solo)'],
    'Not competitively scored -- just log a 1 once you have played a game, win, lose, or practiced alone.',
    array['Log 1 to record that you played', 'Win, lose, or practice alone -- this one is just for reps'],
    '1/1', '1/1', '1/1', '1/1', 1, 'higher'
  ),
  (
    '4-ball', '4 Ball', 'putter',
    'Set up 4 stations: 20 feet (2-foot radius), 10 feet (2-foot radius), 6 feet (must hole), 3 feet (must hole).',
    array['Putter', '4 golf balls'],
    'Hit all 4 balls from each station before moving to the next -- 4 stations x 4 balls = 16 putts. Play 3 rounds. Record your best round as your score.',
    array['1 point per ball landing in-radius or holed at the 20ft/10ft stations', '1 point per ball holed at the 6ft/3ft stations (radius does not count)', '16 putts per round, 3 rounds total -- best round counts'],
    '14/16', '12/16', '10/16', '8/16', 16, 'higher'
  ),
  (
    'twenty-one', '21', 'putter',
    'Play with a partner, or by yourself with two balls (A, B). Putt from anywhere. A 3-foot putt is worth 1 point, a 9-foot putt is worth 2, a 15-foot putt is worth 3 -- you must make the putt to score. First to 21 wins.',
    array['Putter', '2 golf balls (if playing solo)'],
    'Not competitively scored -- just log a 1 once you have played a game, win, lose, or practiced alone.',
    array['Log 1 to record that you played', 'Win, lose, or practice alone -- this one is just for reps'],
    '1/1', '1/1', '1/1', '1/1', 1, 'higher'
  ),
  (
    'fives', '5''s', 'putter',
    '5 putts each from 5, 10, 15, 20, and 25 feet -- 25 putts total.',
    array['Putter', '25 golf balls'],
    'Play 3 rounds of 25 putts. Record your best round as your score.',
    array['1 point per made putt', '25 putts per round, 3 rounds total -- best round counts'],
    '22/25', '20/25', '15/25', '10/25', 25, 'higher'
  ),
  (
    'reverse-ladder', 'Reverse Ladder', 'putter',
    'Same idea as the Ladder Drill, but reversed -- start at the farthest barrier and work back toward the start. Putting is all about where the ball stops: each one must stop short of the previous ball, but beyond the starting barrier.',
    array['Putter', 'Several golf balls'],
    'Keep putting, working the ladder one spot closer each time, until you miss -- stop short of the starting barrier, or fail to stop short of the previous ball. No cap on attempts. Play 3 rounds. Record your best round as your score.',
    array['1 point for every ball that stops closer than the last one, short of the starting barrier', 'No cap on attempts -- keep going until you miss', '3 rounds total -- best round counts'],
    '7/11', '5/11', '4/11', '3/11', 11, 'higher'
  );

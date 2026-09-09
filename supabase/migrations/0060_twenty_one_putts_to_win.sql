-- "21" used to just log a 1 for playing -- not competitively scored at
-- all. Give it a real score: how many putts it took to reach 21 points.
-- Fewer is better, but there's no clean min/max the way most drills have
-- one -- the true minimum (7 putts, all 3-pointers made) only happens if
-- you never miss, which isn't realistic, so targets below are typical
-- good putts-to-21 counts per tier rather than a hard ceiling or floor.

update drills
set
  rules_description = 'Race to 21 points, then log how many putts it took you to get there -- makes and misses both count toward the total.',
  rules_scoring = array[
    '3-foot putt made = 1 point, 9-foot = 2 points, 15-foot = 3 points',
    'Keep putting (make or miss) until you reach 21 points total',
    'Log the total number of putts it took, makes and misses included',
    'Fewer putts is better -- there''s no fixed target since it depends on your mix of makes and misses'
  ],
  target_scratch = '10',
  target_low = '13',
  target_mid = '17',
  target_high = '22',
  max_score = 99,
  score_direction = 'lower'
where id = 'twenty-one';

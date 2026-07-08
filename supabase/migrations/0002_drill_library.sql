-- Adds 9 more drills and lays out a real 2-week Mon-Fri daily_golfable
-- calendar (Driver Monday, Irons/Wedges alternating Tue/Thu/Fri, Putter
-- Wednesday), matching the weekly category pattern from the product spec.
-- Weekends intentionally get no daily_golfable row. Safe to re-run.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values
  (
    'fairway-finder', 'Fairway Finder', 'driver',
    'Pick a hole with a fairway you can see the width of. Hit 10 drives, aiming to find the short grass every time.',
    array['Driver', '10 golf balls'],
    'Play 10 tee shots with your driver. No mulligans, no provisional re-hits — the first swing counts.',
    array['1 point per drive that finishes in the fairway', 'Rough, bunkers, and hazards don''t count', '10 drives total'],
    '8/10', '6/10', '4/10', '2/10', 10
  ),
  (
    '4s-and-5s', '4s and 5s', 'driver',
    'Alternate tee shots between your driver and your 5-wood, five swings with each club, both aimed at the same fairway.',
    array['Driver', '5-wood (or 3-wood)', '10 golf balls'],
    'Play 10 tee shots total, switching clubs every swing (driver, 5-wood, driver, 5-wood...).',
    array['1 point per shot that finishes in the fairway', 'Alternate clubs every swing, no exceptions', '10 shots total, 5 per club'],
    '7/10', '5/10', '3/10', '1/10', 10
  ),
  (
    'the-approach', 'The Approach', 'irons',
    'From 130 yards, pick a green with a visible flag. Hit 10 approach shots at the pin.',
    array['Mid-iron', '10 golf balls'],
    'Play 10 approach shots from 130 yards. Each ball is judged on where it finishes, not how it looked getting there.',
    array['1 point per ball that finishes on the green', '10 balls total'],
    '8/10', '6/10', '4/10', '2/10', 10
  ),
  (
    'fairway-accuracy', 'Fairway Accuracy', 'irons',
    'Mark a 20-yard-wide zone 150-170 yards out. Hit 10 iron shots aiming to land inside it.',
    array['Mid-iron', '10 golf balls', '20-yard-wide target zone (tees or alignment sticks)'],
    'Play 10 shots at the marked zone. Distance doesn''t matter here — only whether the ball lands inside the width markers.',
    array['1 point per ball landing inside the zone', '10 balls total'],
    '7/10', '5/10', '3/10', '1/10', 10
  ),
  (
    'par-3-simulator', 'Par 3 Simulator', 'irons',
    'Pick a target 150-180 yards out. Play 9 balls, one at a time, as if each were its own par 3 hole.',
    array['Iron of your choice', '9 golf balls'],
    'Play 9 balls to the same target, treating each shot like a fresh hole. Reset your routine between every ball.',
    array['1 point per ball that finishes on the green', '9 balls total'],
    '7/9', '5/9', '3/9', '1/9', 9
  ),
  (
    'landing-zone', 'Landing Zone', 'wedges',
    'Set up three 10-foot landing circles at 30, 50, and 70 yards. Hit 3 balls to each distance.',
    array['Wedge', '9 golf balls', '3 target circles (10-foot radius) at 30, 50, and 70 yards'],
    'Play 3 balls per distance, starting at 30 yards and working out to 70. A ball counts if it lands inside the circle.',
    array['1 point per ball landing inside its circle', '9 balls total across the 3 distances'],
    '7/9', '5/9', '3/9', '1/9', 9
  ),
  (
    'up-and-down', 'Up and Down', 'wedges',
    'Drop 10 balls just off the green in a mix of lies — rough, fringe, light rough. From each, chip or pitch it on, then putt out.',
    array['Wedge', 'Putter', '10 golf balls'],
    'Play each ball as its own up-and-down: one short-game shot to get on, then finish it out on the green.',
    array['1 point for every ball holed in 2 total strokes or fewer', '10 balls total'],
    '7/10', '5/10', '3/10', '1/10', 10
  ),
  (
    'the-gate', 'The Gate', 'putter',
    'Push two tees into the green just wider than your putter head, a few inches in front of the ball, forming a gate. Putt 10 balls from 6 feet.',
    array['Putter', '2 tees', '10 golf balls'],
    'Play 10 putts from 6 feet, each one required to pass cleanly through the gate on its way to the hole.',
    array['1 point per made putt that passes through the gate without touching the tees', '10 putts total'],
    '9/10', '7/10', '5/10', '3/10', 10
  ),
  (
    'putting-ladder', 'Putting Ladder', 'putter',
    'Place two balls at each distance: 3, 6, 9, and 12 feet from the hole.',
    array['Putter', '8 golf balls', 'Tees or markers at 3, 6, 9, and 12 feet'],
    'Putt out both balls at 3 feet before moving to 6, then 9, then 12. Work up the ladder in order.',
    array['1 point per made putt', '8 putts total across the 4 distances'],
    '7/8', '5/8', '3/8', '2/8', 8
  )
on conflict (id) do nothing;

-- 2-week Mon-Fri calendar: Week A starts this Monday, Week B the Monday after.
do $$
declare
  monday_a date := date_trunc('week', current_date)::date;
  monday_b date := monday_a + 7;
begin
  insert into daily_golfable (date, drill_id) values
    (monday_a + 0, 'fairway-finder'),
    (monday_a + 1, 'the-approach'),
    (monday_a + 2, 'the-gate'),
    (monday_a + 3, 'landing-zone'),
    (monday_a + 4, 'fairway-accuracy')
  on conflict (date) do update set drill_id = excluded.drill_id;

  insert into daily_golfable (date, drill_id) values
    (monday_b + 0, '4s-and-5s'),
    (monday_b + 1, 'up-and-down'),
    (monday_b + 2, 'putting-ladder'),
    (monday_b + 3, 'par-3-simulator'),
    (monday_b + 4, 'the-clock')
  on conflict (date) do update set drill_id = excluded.drill_id;
end $$;

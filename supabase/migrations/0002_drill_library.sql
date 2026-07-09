-- Adds 9 more drills and lays out a real 2-week Mon-Fri daily_golfable
-- calendar (Driver Monday, Irons/Wedges alternating Tue/Thu/Fri, Putter
-- Wednesday), matching the weekly category pattern from the product spec.
-- Weekends intentionally get no daily_golfable row. Safe to re-run --
-- on conflict updates existing rows so content edits take effect.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values
  (
    'fairway-finder', 'Fairway Finder', 'driver',
    'On the driving range, mark out an imaginary fairway that''s 30 yards wide. Hit 10 drives, aiming to find the short grass every time.',
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
    '8/10', '6/10', '4/10', '2/10', 10
  ),
  (
    'the-approach', 'The Approach', 'irons',
    'Pick a green with a visible flag and play from your tier''s distance: 100 yards (High), 125 yards (Mid), 150 yards (Low), or 165 yards (Scratch+). Hit 10 approach shots at the pin.',
    array['Iron of your choice', '10 golf balls'],
    'Play 3 full rounds of 10 approach shots from your tier''s distance — record your best round. Each ball is judged on where it finishes, not how it looked getting there.',
    array['1 point per ball that finishes on the green', 'Play 3 rounds of 10 balls; your best round counts', '10 balls per round'],
    '7/10', '6/10', '5/10', '3/10', 10
  ),
  (
    'fairway-accuracy', 'Fairway Accuracy', 'irons',
    'Mark a 20-yard-wide zone 150-170 yards out. Hit 10 iron shots aiming to land inside it.',
    array['Mid-iron', '10 golf balls', '20-yard-wide target zone'],
    'Play 3 rounds of 10 shots at the marked zone — record your best round of the 3. Distance doesn''t matter here — only whether the ball lands inside the width markers.',
    array['1 point per ball landing inside the zone', 'Play 3 rounds; record your best round of the 3', '10 balls per round'],
    '7/10', '5/10', '3/10', '1/10', 10
  ),
  (
    'par-3-simulator', 'Par 3 Simulator', 'irons',
    'Play from your tier''s yardage range: 80-120 yards (High), 120-150 yards (Mid), 135-165 yards (Low), or 150-180 yards (Scratch+). Play 9 balls, one at a time, as if each were its own par 3 hole — pick a new distance and target inside your range every shot.',
    array['Iron of your choice', '9 golf balls'],
    'Play 9 balls, treating each shot like a fresh hole at a new yardage inside your tier''s range. Reset your routine between every ball.',
    array['1 point per ball that finishes on the green', 'Change the distance and target within your tier''s range every shot', '9 balls total'],
    '7/9', '7/9', '5/9', '3/9', 9
  ),
  (
    'landing-zone', 'Landing Zone', 'wedges',
    'Find three targets on the driving range: 30, 50, and 70 yards out. Imagine a 10-foot circle landing zone around each one. Hit 3 balls to each distance, across 3 rounds — record your best score.',
    array['Wedge', '9 golf balls', '3 target circles (10-foot radius) at 30, 50, and 70 yards'],
    'Play 3 balls per distance, starting at 30 yards and working out to 70. A ball counts if it lands inside the circle.',
    array['1 point per ball landing inside its circle', 'Play 3 rounds; record your best score', '9 balls per round across the 3 distances'],
    '7/9', '5/9', '3/9', '1/9', 9
  ),
  (
    'up-and-down', 'Up and Down', 'wedges',
    'Drop 5 balls just off the green in a mix of lies — rough, fringe, light rough. From each, chip or pitch it on, then putt out. Play 3 rounds and record your best round.',
    array['Wedge', 'Putter', '5 golf balls'],
    'Play each ball as its own up-and-down: one short-game shot to get on, then finish it out on the green.',
    array['2 points for a chip holed directly', '1 point for a chip followed by a holed putt (up-and-down)', '-1 point if you need more than one putt after the chip', '0 is the lowest you can log — if your round nets below zero, record a 0', 'Play 3 rounds of 5 balls; record your best round'],
    '3/10', '2/10', '2/10', '1/10', 10
  ),
  (
    'pitch-and-chip', 'Pitch & Chip', 'wedges',
    'Pick one wedge and two greenside holes near each other: one to pitch to (a shot that spends more time in the air than on the ground) and one to chip to (a shot that rolls out more than it flies). Hit 5 shots at the pitch hole, then 5 at the chip hole.',
    array['Wedge', '10 golf balls'],
    'Play 5 shots to the pitch hole, then 5 to the chip hole — 10 shots total, practicing two different short-game techniques with the same club.',
    array['2 points for a holed shot', '1 point for a shot left inside a tap-in (about 1 foot)', '-1 point for a shot finishing farther than 4 feet away', '0 is the lowest you can log — if your round nets below zero, record a 0', '5 shots per target, 10 shots total'],
    '8/20', '7/20', '6/20', '4/20', 20
  ),
  (
    'the-gate', 'The Gate', 'putter',
    'Push two tees into the green just wider than your putter head, right next to the ball, forming a putter gate. Push two more tees into the green just wider than the ball, about 6 inches in front of it, forming a ball gate. Putt 10 balls from 6 feet, clearing both gates cleanly. Play 3 rounds and record your best score of the 3.',
    array['Putter', '4 tees', '10 golf balls'],
    'Play 10 putts from 6 feet, each one required to pass cleanly through both gates on its way to the hole.',
    array['1 point per made putt that passes through both gates without touching the tees', 'Play 3 rounds; record your best score of the 3', '10 putts per round'],
    '9/10', '7/10', '5/10', '3/10', 10
  ),
  (
    'putting-ladder', 'Putting Ladder', 'putter',
    'Push two tees into the green 10 feet apart to mark a landing window. Putt from 10 feet behind the first tee. Your first ball should just clear the first tee — after that, every ball needs to land inside the window and finish farther than the one before it.',
    array['Putter', '10 golf balls', '2 tees'],
    'Putt one ball at a time. Each ball only scores if it lands inside the window and beats the distance of your previous ball. Play 10 balls.',
    array['1 point per ball that lands inside the window and finishes farther than the previous ball', '10 balls total'],
    '10/10', '8/10', '6/10', '4/10', 10
  )
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  setup_description = excluded.setup_description,
  setup_equipment = excluded.setup_equipment,
  rules_description = excluded.rules_description,
  rules_scoring = excluded.rules_scoring,
  target_scratch = excluded.target_scratch,
  target_low = excluded.target_low,
  target_mid = excluded.target_mid,
  target_high = excluded.target_high,
  max_score = excluded.max_score;

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
    (monday_b + 4, 'pitch-and-chip')
  on conflict (date) do update set drill_id = excluded.drill_id;
end $$;

-- The Clock was replaced by Pitch & Chip (renamed id). Drop the old row
-- once nothing references it; harmless no-op if it was never seeded.
delete from drills
where id = 'the-clock'
  and not exists (select 1 from scores where scores.drill_id = 'the-clock')
  and not exists (select 1 from daily_golfable where daily_golfable.drill_id = 'the-clock');

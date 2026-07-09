-- Adds a third week of drills (Week C) so the daily_golfable calendar
-- extends one week past the existing Week A/B rotation from 0002.
-- Same Mon-Fri category pattern (Driver Monday, Putter Wednesday,
-- Irons/Wedges alternating Tue/Thu/Fri). Safe to re-run.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values
  (
    'fairway-chute', 'Fairway Chute', 'driver',
    'On the driving range, set two tees or markers about 20 yards apart, 100+ yards out, forming a narrow chute. Hit 10 drives trying to carry the ball between them.',
    array['Driver', '2 tees or markers', '10 golf balls'],
    'Play 10 tee shots with your driver. The ball must pass through the chute in the air or on its first bounce to count.',
    array['1 point per drive that passes through the chute', '10 drives total'],
    '7/10', '5/10', '3/10', '1/10', 10
  ),
  (
    'three-club-ladder', 'Three Club Ladder', 'irons',
    'Pick three targets at increasing distances within your iron range -- short, mid, and long. Hit 3 balls to each, using the club that matches.',
    array['Short iron', 'Mid iron', 'Long iron', '9 golf balls'],
    'Play 3 balls at each distance, working from short to long. Switch clubs as the distance increases.',
    array['1 point per ball that finishes on the green', '9 balls total across the 3 distances'],
    '7/9', '5/9', '3/9', '1/9', 9
  ),
  (
    'around-the-world', 'Around the World', 'putter',
    'Place 8 balls in a circle around the hole, all roughly 4 feet away, evenly spaced like numbers on a clock.',
    array['Putter', '8 golf balls'],
    'Putt each ball in order around the circle. Every putt is a fresh 4-footer from a new angle.',
    array['1 point per made putt', '8 putts total'],
    '7/8', '6/8', '4/8', '2/8', 8
  ),
  (
    'sand-save', 'Sand Save', 'wedges',
    'Drop 8 balls into a greenside bunker in a mix of lies. From each, play a bunker shot toward the green.',
    array['Sand wedge', '8 golf balls'],
    'Play each ball as its own bunker escape -- the goal is simply to finish on the green.',
    array['1 point per ball that finishes on the green', '8 balls total'],
    '6/8', '4/8', '3/8', '1/8', 8
  ),
  (
    'proximity-test', 'Proximity Test', 'irons',
    'Pick a green with a visible flag at a comfortable iron distance. Hit 10 approach shots, judging each one by how close it finishes.',
    array['Iron of your choice', '10 golf balls'],
    'Play 10 approach shots at the same target. Each ball is scored by proximity to the pin, not just whether it''s on the green.',
    array['2 points if the ball finishes within 15 feet of the pin', '1 point if it''s on the green but outside 15 feet', '0 points if it misses the green', '10 balls total'],
    '12/20', '9/20', '6/20', '3/20', 20
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

-- Week C: the Monday two weeks after Week A's Monday (i.e. one week past
-- the existing Week B rotation from 0002).
do $$
declare
  monday_c date := date_trunc('week', current_date)::date + 14;
begin
  insert into daily_golfable (date, drill_id) values
    (monday_c + 0, 'fairway-chute'),
    (monday_c + 1, 'three-club-ladder'),
    (monday_c + 2, 'around-the-world'),
    (monday_c + 3, 'sand-save'),
    (monday_c + 4, 'proximity-test')
  on conflict (date) do update set drill_id = excluded.drill_id;
end $$;

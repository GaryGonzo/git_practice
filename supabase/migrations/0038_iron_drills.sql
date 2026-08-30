-- Adds 15 new Irons drills, matching the treatment Driver & Woods got in
-- 0035: single-club and multi-club variants of distance, sweet-spot/face-
-- control, ground contact, plus a couple of trajectory-control drills
-- (The Punch, The Flyer) that don't have a driver-category equivalent.

insert into drills (
  id, name, category,
  setup_description, setup_equipment,
  rules_description, rules_scoring,
  target_scratch, target_low, target_mid, target_high,
  max_score
) values
  (
    'max-distance-iron', 'Max Distance - One Club', 'irons',
    'Grab your longest iron. Mark out an imaginary 20-yard-wide fairway at that club''s typical distance.',
    array['Longest iron', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score.',
    array['1 point per shot that lands in the 20-yard fairway and beyond your average carry with that club', '5 shots per round, 3 rounds total -- best round counts'],
    '5/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'max-distance-irons-multi', 'Max Distance - Multiple Clubs', 'irons',
    'Pick any 3 irons. Alternate between them shot to shot, marking out an imaginary 20-yard-wide fairway at each club''s typical distance.',
    array['3 irons of your choice', '18 golf balls'],
    'Play 3 rounds of 6 shots (2 per club, alternating). Record your best round as your score.',
    array['1 point per shot that lands in the 20-yard fairway and beyond your average carry with that specific club', '6 shots per round (2 per club), 3 rounds total -- best round counts'],
    '6/6', '5/6', '4/6', '3/6', 6
  ),
  (
    'distance-control-irons-clubs', 'Distance Control - Multiple Clubs', 'irons',
    'Pick a distance you hit with a full swing on one iron (e.g., a strong 9-iron at 130 yards). Match that same distance with two other clubs using partial or punch swings (e.g., a soft 8-iron, a punched 7-iron running out to 130).',
    array['3 irons of your choice', '18 golf balls'],
    'Each round is 6 shots -- 2 per club, alternating clubs each shot. Play 3 rounds. Record your best round as your score.',
    array['1 point for landing within 5 yards of the target distance', '6 shots per round (2 per club), 3 rounds total -- best round counts'],
    '6/6', '5/6', '4/6', '2/6', 6
  ),
  (
    'distance-control-irons-distance', 'Distance Control - Multiple Distance', 'irons',
    'Pick one iron. Identify your stock distance with it, plus a target about 10 yards shorter and one about 10 yards longer -- three targets total.',
    array['1 iron of your choice', '18 golf balls'],
    'Each round is 6 shots, alternating targets each shot (2 attempts at each distance). Play 3 rounds. Record your best round as your score.',
    array['1 point for landing within 5 yards of the called target', '6 shots per round (2 attempts at each distance), 3 rounds total -- best round counts'],
    '6/6', '4/6', '3/6', '2/6', 6
  ),
  (
    'green-hunting-iron', 'Green Hunting - One Club', 'irons',
    'Pick a 7, 8, or 9 iron and simulate a green at an appropriate distance for that club (roughly average-green-sized, for a medium-difficulty course).',
    array['7, 8, or 9 iron', '30 golf balls'],
    'Play 3 rounds of 10 shots toward the green. Record your best round as your score.',
    array['1 point for finding the green', '2 points if the shot finishes within 5 feet of the hole (not additive with the point above)', '10 shots per round, 3 rounds total -- best round counts'],
    '16/20', '12/20', '10/20', '8/20', 20
  ),
  (
    'green-hunting-irons-multi', 'Green Hunting - Multiple Clubs', 'irons',
    'Same green as Green Hunting - One Club. Cycle through your stock club, one club up, and one club down -- changing clubs every shot.',
    array['3 irons (one up, stock, one down)', '30 golf balls'],
    'Play 3 rounds of 10 shots, changing clubs every shot. Record your best round as your score.',
    array['1 point for finding the green', '2 points if the shot finishes within 5 feet of the hole (not additive with the point above)', '10 shots per round, 3 rounds total -- best round counts'],
    '16/20', '12/20', '10/20', '8/20', 20
  ),
  (
    'par-3s', 'Par 3''s', 'irons',
    'Pick 4 real par-3 holes from a course you know or plan to play soon, and simulate each tee shot with the right iron for that hole''s distance.',
    array['Irons appropriate to each hole', '4 golf balls per round'],
    'One round is 4 tee shots, one per hole. Play 3 rounds. Record your best round as your score.',
    array['1 point per green hit', '4 tee shots per round, 3 rounds total -- best round counts'],
    '4/4', '3/4', '2/4', '1/4', 4
  ),
  (
    'sweet-spot-iron', 'Sweet Spot - Irons (1)', 'irons',
    'Spray your 7-iron face with foot spray or chalk spray so each strike leaves a mark. Wipe and reapply as the marks wear off or get hard to read.',
    array['7-iron (or any iron)', 'Foot spray or chalk spray', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score.',
    array['1 point for a shot that strikes the true center of the face', '0 points for anything off-center', '5 shots per round, 3 rounds total -- best round counts'],
    '5/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'sweet-spot-irons-multi', 'Sweet Spot - Irons (3)', 'irons',
    'Same impact-spray approach, alternating across a long iron (2-5), your 7-iron, and a short iron (9-iron or PW) each shot.',
    array['Long iron (2-5)', '7-iron', 'Short iron (9/PW)', 'Foot spray or chalk spray', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score.',
    array['1 point for a shot that strikes the true center of the face', '0 points for anything off-center', '5 shots per round, 3 rounds total -- best round counts'],
    '5/5', '4/5', '3/5', '2/5', 5
  ),
  (
    'face-control-iron', 'Face Control - Irons (1)', 'irons',
    'Spray your 7-iron face with foot spray or chalk spray so each strike leaves a mark. This drill comes from renowned instructor Adam Young -- purposely mishitting in specific zones builds real clubface awareness and control.',
    array['7-iron', 'Foot spray or chalk spray', '18 golf balls'],
    'Hit 6 shots per round: shots 1-2 aiming for the heel, shots 3-4 aiming for the toe, shots 5-6 aiming for the sweet spot. Every shot should still contact the face -- just deliberately toward the targeted zone. Play 3 rounds and record your best.',
    array['1 point for each shot that strikes its targeted zone (heel, toe, or center)', '6 shots per round (2 each at heel, toe, and center), 3 rounds total -- best round counts'],
    '6/6', '5/6', '4/6', '3/6', 6
  ),
  (
    'face-control-irons-multi', 'Face Control - Irons (3)', 'irons',
    'Spray a long iron (2-5), your 7-iron, and a short iron (9/PW) with foot spray or chalk spray. This drill comes from renowned instructor Adam Young -- purposely mishitting in specific zones builds real clubface awareness and control.',
    array['Long iron (2-5)', '7-iron', 'Short iron (9/PW)', 'Foot spray or chalk spray', '27 golf balls'],
    'Hit 9 shots per round: 3 heel shots (one with each club), then 3 toe shots (one with each club), then 3 sweet-spot shots (one with each club). Every shot should still contact the face -- just deliberately toward the targeted zone. Play 3 rounds and record your best.',
    array['1 point for each shot that strikes its targeted zone (heel, toe, or center)', '9 shots per round (3 each at heel, toe, and center, one per club), 3 rounds total -- best round counts'],
    '6/9', '5/9', '4/9', '3/9', 9
  ),
  (
    'ground-contact-iron', 'Ground Contact - Irons (1)', 'irons',
    'Place a thin towel on the ground just behind your ball -- thin enough you won''t catch it on your backswing. A well-struck shot takes the ball first and misses the towel.',
    array['Any iron (7-iron recommended)', 'A thin towel', '15 golf balls'],
    'Play 3 rounds of 5 shots. Record your best round as your score. Set the towel distance behind the ball for your tier: 8 inches (High), 4 inches (Mid), 2 inches (Low), 1 inch (Scratch+).',
    array['1 point per shot that strikes the ball cleanly and misses the towel', '5 shots per round, 3 rounds total -- best round counts'],
    '5/5, towel 1" behind ball', '5/5, towel 2" behind ball', '5/5, towel 4" behind ball', '5/5, towel 8" behind ball', 5
  ),
  (
    'ground-contact-irons-multi', 'Ground Contact - Irons (3)', 'irons',
    'Same towel setup, alternating a long iron, mid iron, and short iron of your choice each shot.',
    array['Long iron', 'Mid iron', 'Short iron (your choice)', 'A thin towel', '18 golf balls'],
    'Play 3 rounds of 6 shots, alternating clubs each shot. Record your best round as your score. Set the towel distance behind the ball for your tier: 8 inches (High), 4 inches (Mid), 2 inches (Low), 1 inch (Scratch+).',
    array['1 point per shot that strikes the ball cleanly and misses the towel', '6 shots per round, 3 rounds total -- best round counts'],
    '6/6, towel 1" behind ball', '6/6, towel 2" behind ball', '6/6, towel 4" behind ball', '6/6, towel 8" behind ball', 6
  ),
  (
    'the-punch', 'The Punch', 'irons',
    'Practice a low ball flight -- like escaping under tree branches or punching into wind. Three target distances: 50 yards (tree escape), 80 yards (tree or wind), 100 yards (wind or bump-and-run). Use whichever club gets you there with a low flight.',
    array['Any iron', '27 golf balls'],
    '9 shots per round -- 3 at 50 yards, then 3 at 80, then 3 at 100. Play 3 rounds. Record your best round as your score.',
    array['1 point per shot that hits its target distance and flies subjectively low', '9 shots per round (3 at each distance), 3 rounds total -- best round counts'],
    '9/9', '8/9', '6/9', '4/9', 9
  ),
  (
    'the-flyer', 'The Flyer', 'irons',
    'Opposite of The Punch -- practice a higher-than-normal ball flight, for popping over a tree, landing soft on a shallow green, or clearing a greenside bunker. Three target distances: 80, 100, and 120 yards.',
    array['Any iron', '27 golf balls'],
    '9 shots per round -- 3 at 80 yards, then 3 at 100, then 3 at 120. Play 3 rounds. Record your best round as your score.',
    array['1 point per shot that hits its target distance and doesn''t run out more than 3 yards (10 feet) after landing', '9 shots per round (3 at each distance), 3 rounds total -- best round counts'],
    '9/9', '8/9', '6/9', '4/9', 9
  );

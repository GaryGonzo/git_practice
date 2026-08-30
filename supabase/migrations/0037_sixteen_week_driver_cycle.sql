-- Extends the daily_golfable calendar from a 3-week loop to a 16-week
-- block so Monday can actually cycle through all 16 of the drills added
-- in 0035 once each, in random order, before repeating -- the 3-week loop
-- couldn't do this since it only had 3 Monday slots total. Leaves history
-- (2026-08-24 through 2026-08-28, already played) untouched and starts the
-- new block at the next Monday. Tuesday-Friday just continue the existing
-- 3-week A/B/C rotation uninterrupted (not part of this request).
--
-- This is a one-time fixed random draw, same as the rest of this project's
-- calendar content -- there's no automated reshuffle. Getting a fresh
-- random 16-week draw for the *next* cycle (after 2026-12-14) requires
-- another migration like this one when that time comes.

update daily_golfable set drill_id = 'fairways-hit-driver' where date = '2026-08-31';
update daily_golfable set drill_id = 'fairways-hit-wood' where date = '2026-09-07';

insert into daily_golfable (date, drill_id) values
  ('2026-09-14', 'changing-targets-driver'),
  ('2026-09-15', 'the-approach'),
  ('2026-09-16', 'the-gate'),
  ('2026-09-17', 'landing-zone'),
  ('2026-09-18', 'fairway-accuracy'),
  ('2026-09-21', 'changing-targets-wood'),
  ('2026-09-22', 'up-and-down'),
  ('2026-09-23', 'putting-ladder'),
  ('2026-09-24', 'par-3-simulator'),
  ('2026-09-25', 'pitch-and-chip'),
  ('2026-09-28', 'max-distance'),
  ('2026-09-29', 'shot-shape-challenge'),
  ('2026-09-30', 'step-back-ladder'),
  ('2026-10-01', 'sand-save'),
  ('2026-10-02', 'proximity-test'),
  ('2026-10-05', 'face-control-driver'),
  ('2026-10-06', 'the-approach'),
  ('2026-10-07', 'the-gate'),
  ('2026-10-08', 'landing-zone'),
  ('2026-10-09', 'fairway-accuracy'),
  ('2026-10-12', 'face-control-wood'),
  ('2026-10-13', 'up-and-down'),
  ('2026-10-14', 'putting-ladder'),
  ('2026-10-15', 'par-3-simulator'),
  ('2026-10-16', 'pitch-and-chip'),
  ('2026-10-19', 'distance-accuracy-driver'),
  ('2026-10-20', 'shot-shape-challenge'),
  ('2026-10-21', 'step-back-ladder'),
  ('2026-10-22', 'sand-save'),
  ('2026-10-23', 'proximity-test'),
  ('2026-10-26', 'max-distance-wood'),
  ('2026-10-27', 'the-approach'),
  ('2026-10-28', 'the-gate'),
  ('2026-10-29', 'landing-zone'),
  ('2026-10-30', 'fairway-accuracy'),
  ('2026-11-02', 'distance-control-driver'),
  ('2026-11-03', 'up-and-down'),
  ('2026-11-04', 'putting-ladder'),
  ('2026-11-05', 'par-3-simulator'),
  ('2026-11-06', 'pitch-and-chip'),
  ('2026-11-09', 'distance-accuracy-wood'),
  ('2026-11-10', 'shot-shape-challenge'),
  ('2026-11-11', 'step-back-ladder'),
  ('2026-11-12', 'sand-save'),
  ('2026-11-13', 'proximity-test'),
  ('2026-11-16', 'par-5s'),
  ('2026-11-17', 'the-approach'),
  ('2026-11-18', 'the-gate'),
  ('2026-11-19', 'landing-zone'),
  ('2026-11-20', 'fairway-accuracy'),
  ('2026-11-23', 'sweet-spot-driver'),
  ('2026-11-24', 'up-and-down'),
  ('2026-11-25', 'putting-ladder'),
  ('2026-11-26', 'par-3-simulator'),
  ('2026-11-27', 'pitch-and-chip'),
  ('2026-11-30', 'sweet-spot-alternating'),
  ('2026-12-01', 'shot-shape-challenge'),
  ('2026-12-02', 'step-back-ladder'),
  ('2026-12-03', 'sand-save'),
  ('2026-12-04', 'proximity-test'),
  ('2026-12-07', 'sweet-spot-wood'),
  ('2026-12-08', 'the-approach'),
  ('2026-12-09', 'the-gate'),
  ('2026-12-10', 'landing-zone'),
  ('2026-12-11', 'fairway-accuracy'),
  ('2026-12-14', 'distance-control-wood'),
  ('2026-12-15', 'up-and-down'),
  ('2026-12-16', 'putting-ladder'),
  ('2026-12-17', 'par-3-simulator'),
  ('2026-12-18', 'pitch-and-chip');

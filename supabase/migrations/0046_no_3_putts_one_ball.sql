-- No 3 Putts is played one hole at a time (putt out, then move to the
-- next distance) -- it only needs 1 ball, not 18.
update drills
set setup_equipment = array['Putter', '1 golf ball']
where id = 'no-3-putts';

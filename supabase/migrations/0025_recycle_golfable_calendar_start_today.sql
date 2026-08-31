-- 0024 recycled the calendar anchored to the *next* upcoming Monday (same
-- rule 0016 used), which left a gap through the rest of this week. Shift
-- back one week so the range starts on this week's Monday instead -- since
-- today (Wed) falls inside that week, today's slot is filled immediately,
-- and the multiple-of-7 shift still preserves the weekday-category pattern.
--
-- This is now the intended recycle rule going forward: anchor to the
-- Monday of the *current* Pacific week, not the next one, so a recycle
-- always covers today rather than waiting until Monday.

do $$
declare
  today_pacific date := (now() at time zone 'America/Los_Angeles')::date;
  old_monday date;
  new_monday date;
  shift_days int;
begin
  select date_trunc('week', min(date))::date into old_monday from daily_golfable;

  new_monday := date_trunc('week', today_pacific)::date;

  shift_days := new_monday - old_monday;

  update daily_golfable set date = date + shift_days;
end $$;

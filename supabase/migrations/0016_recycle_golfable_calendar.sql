-- The 3-week Mon-Fri daily_golfable calendar seeded in 0002/0003 has run
-- out and nothing in it was ever played (no scores reference those dates),
-- so it's safe to recycle: shift every existing row forward by a whole
-- number of weeks so the earliest one lands on the next upcoming Monday
-- (Pacific-anchored, matching the app's day boundary). Shifting by a
-- multiple of 7 preserves the original weekday-category pattern (Driver
-- Monday, Putter Wednesday, Irons/Wedges alternating Tue/Thu/Fri)
-- automatically -- no need to re-specify it.

do $$
declare
  today_pacific date := (now() at time zone 'America/Los_Angeles')::date;
  old_monday date;
  new_monday date;
  shift_days int;
begin
  select date_trunc('week', min(date))::date into old_monday from daily_golfable;

  new_monday := date_trunc('week', today_pacific)::date
    + case when today_pacific > date_trunc('week', today_pacific)::date then 7 else 0 end;

  shift_days := new_monday - old_monday;

  update daily_golfable set date = date + shift_days;
end $$;

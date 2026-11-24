-- profiles uses column-level update grants; handicap_band (added in 0071)
-- was never granted, so saving it from the app failed with "permission
-- denied" and the question kept coming back.
grant update (handicap_band) on public.profiles to authenticated;

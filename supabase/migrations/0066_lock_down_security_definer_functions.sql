-- Signed-out visitors (the anon role) could call these SECURITY DEFINER
-- functions directly over the API. Each one already checks auth.uid() and
-- refuses anyone not entitled, so nothing leaked -- this removes the open
-- door anyway. Signed-in users keep EXECUTE on the six the app calls.
-- The two trigger functions are never meant to be called over the API at
-- all; triggers still fire without an EXECUTE grant.

revoke execute on function public.admin_user_overview() from public, anon;
revoke execute on function public.assign_individual_tier(uuid) from public, anon;
revoke execute on function public.cancel_studio(uuid) from public, anon;
revoke execute on function public.get_forum_notification_counts() from public, anon;
revoke execute on function public.leave_studio() from public, anon;
revoke execute on function public.studio_roster(uuid) from public, anon;

grant execute on function public.admin_user_overview() to authenticated;
grant execute on function public.assign_individual_tier(uuid) to authenticated;
grant execute on function public.cancel_studio(uuid) to authenticated;
grant execute on function public.get_forum_notification_counts() to authenticated;
grant execute on function public.leave_studio() to authenticated;
grant execute on function public.studio_roster(uuid) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_new_signup() from public, anon, authenticated;

-- Belt and braces for signups: the auth service inserts into auth.users as
-- supabase_auth_admin, which fires both triggers. Triggers shouldn't need
-- EXECUTE at fire time, but grant it explicitly so signups never depend on
-- that detail.
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant execute on function public.notify_new_signup() to supabase_auth_admin;

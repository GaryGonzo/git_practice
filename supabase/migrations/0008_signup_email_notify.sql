-- Emails the founder every time someone signs up, sent directly from
-- Postgres via Resend's API using the pg_net extension -- no Zapier/Make
-- account needed. Runs as a separate trigger from handle_new_user() so a
-- Resend outage or bad API key can never block or slow down signup.
--
-- The Resend API key is NOT stored in this file (it's committed to git).
-- Store it once, directly in the SQL Editor, via Supabase Vault:
--   select vault.create_secret('re_your_real_key', 'resend_api_key');
-- If that trigger fails with "relation vault.decrypted_secrets does not
-- exist", enable it first: Dashboard -> Database -> Extensions -> search
-- "supabase_vault" -> Enable.

create extension if not exists pg_net with schema extensions;

create or replace function notify_new_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  resend_key text;
begin
  select decrypted_secret into resend_key
  from vault.decrypted_secrets
  where name = 'resend_api_key';

  -- Secret not set up yet -- skip quietly rather than blocking the signup.
  if resend_key is null then
    return new;
  end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || resend_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Golfable <onboarding@resend.dev>',
      'to', array['garygonzo.gg@gmail.com'],
      'subject', 'New Golfable signup: ' || coalesce(new.raw_user_meta_data ->> 'first_name', 'Someone'),
      'html', format(
        '<p><strong>%s %s</strong> just signed up for Golfable.</p><ul><li>Email: %s</li><li>Tier: %s</li><li>Weekly goal: %s</li></ul>',
        coalesce(new.raw_user_meta_data ->> 'first_name', ''),
        coalesce(new.raw_user_meta_data ->> 'last_name', ''),
        new.email,
        coalesce(new.raw_user_meta_data ->> 'tier', ''),
        coalesce(new.raw_user_meta_data ->> 'weekly_goal', '4')
      )
    )
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_notify on auth.users;
create trigger on_auth_user_created_notify
  after insert on auth.users
  for each row execute function notify_new_signup();

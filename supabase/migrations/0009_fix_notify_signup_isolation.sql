-- notify_new_signup() runs inside the same transaction as account creation
-- (it's a trigger on auth.users). Without this, any failure inside it --
-- a pg_net signature mismatch, a vault lookup hiccup, anything -- rolls
-- back the whole signup, not just the notification. A side-effect email
-- should never be able to block someone from creating an account, so wrap
-- the whole body in an exception handler that swallows and logs failures
-- instead of propagating them.

create or replace function notify_new_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  resend_key text;
begin
  begin
    select decrypted_secret into resend_key
    from vault.decrypted_secrets
    where name = 'resend_api_key';

    if resend_key is not null then
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
    end if;
  exception when others then
    -- Never let a notification failure block account creation.
    raise warning 'notify_new_signup failed: %', sqlerrm;
  end;

  return new;
end;
$$;

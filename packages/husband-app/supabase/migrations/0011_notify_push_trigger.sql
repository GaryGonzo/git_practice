-- Calls the send-push Edge Function directly via pg_net whenever a row is
-- inserted into notifications, bypassing the Database Webhooks dashboard
-- feature entirely (which errored with "supabase_functions" does not exist
-- on this project). pg_net.http_post is async -- it queues the request and
-- returns immediately, so this doesn't slow down the insert that fires it.

create or replace function notify_push()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://agkmewcoqevnvnzeylox.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna21ld2NvcWV2bnZuemV5bG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODQwNzEsImV4cCI6MjEwMTk2MDA3MX0.R30Zakz05ycr1NCe2QJ7pW2H4H-3psifWKRbV9y655U'
    ),
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;

drop trigger if exists on_notification_created_push on notifications;
create trigger on_notification_created_push
  after insert on notifications
  for each row execute function notify_push();

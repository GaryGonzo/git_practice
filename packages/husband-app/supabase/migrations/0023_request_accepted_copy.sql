-- The "Start" action is now "Accept" in the UI on both Requests and Tasks
-- (a request made a while in advance doesn't always mean he's "starting"
-- it right away) -- match the notification title fired for that status
-- change. Tasks already got this treatment in 0015; this does the same
-- for requests.

create or replace function notify_request_started()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'in_progress' and old.status is distinct from 'in_progress' and new.requested_by != new.assigned_to then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, request_id)
    values (
      new.household_id,
      new.requested_by,
      new.assigned_to,
      'request_started',
      'Request accepted',
      coalesce((select label from perk_catalog where key = new.perk_key), new.custom_label),
      new.id
    );
  end if;
  return new;
end;
$$;

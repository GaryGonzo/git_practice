-- Starting a request/task ("I'm on it") never notified the other partner --
-- only creation, completion, and decline did. Close that gap so starting
-- something gives the same live feedback as the other status changes.

create function notify_request_started()
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
      'Request started',
      coalesce((select label from perk_catalog where key = new.perk_key), new.custom_label),
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger on_request_started
  after update on requests
  for each row execute function notify_request_started();

create function notify_task_started()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'in_progress' and old.status is distinct from 'in_progress' and new.created_by != new.assigned_to then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, task_id)
    values (new.household_id, new.created_by, new.assigned_to, 'task_started', 'Task started', new.title, new.id);
  end if;
  return new;
end;
$$;

create trigger on_task_started
  after update on tasks
  for each row execute function notify_task_started();

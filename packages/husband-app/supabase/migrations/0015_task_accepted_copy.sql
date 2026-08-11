-- The "Start" action on a task is now labeled "Accepted" in the UI --
-- match the notification title fired for that same status change. Safe to
-- run whether or not 0014 has already been applied (create or replace
-- creates the function if it doesn't exist yet).

create or replace function notify_task_started()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'in_progress' and old.status is distinct from 'in_progress' and new.created_by != new.assigned_to then
    insert into notifications (household_id, recipient_id, actor_id, kind, title, body, task_id)
    values (new.household_id, new.created_by, new.assigned_to, 'task_started', 'Task accepted', new.title, new.id);
  end if;
  return new;
end;
$$;

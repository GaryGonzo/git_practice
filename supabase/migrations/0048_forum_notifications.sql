-- Forum notification badge. One counter, computed server-side because it
-- means something different depending on who's asking:
--   - Admins: every new thread since they last opened the forum (replies
--     don't count -- they want to know when something new got posted, not
--     every reply to it).
--   - Everyone else: new threads started by an admin (the "important
--     update" broadcast) plus new replies to threads *they* started
--     (someone responded to their post). A regular member's new thread
--     doesn't notify other members -- that's the admin's signal to watch,
--     not theirs.

alter table profiles add column if not exists forum_last_seen_at timestamptz;

grant update (forum_last_seen_at) on profiles to authenticated;

create or replace function get_forum_notification_count()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  me profiles%rowtype;
  since timestamptz;
  cnt integer;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then
    return 0;
  end if;

  since := coalesce(me.forum_last_seen_at, 'epoch'::timestamptz);

  if me.is_admin then
    select count(*) into cnt
    from forum_threads t
    where t.status = 'visible' and t.created_at > since;
  else
    select
      (select count(*)
       from forum_threads t
       join profiles a on a.id = t.author_id
       where t.status = 'visible' and a.is_admin and t.created_at > since)
      +
      (select count(*)
       from forum_replies r
       join forum_threads t on t.id = r.thread_id
       where r.status = 'visible'
         and t.author_id = me.id
         and r.author_id <> me.id
         and r.created_at > since)
    into cnt;
  end if;

  return cnt;
end;
$$;

grant execute on function get_forum_notification_count() to authenticated;

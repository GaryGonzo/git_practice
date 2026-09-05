-- Per-category forum notifications. The hub screen (General Chat, Q&A,
-- Feedback & Ideas) needs its own badge per category, which means "seen"
-- has to be tracked per category too -- marking everything seen the moment
-- someone lands on the hub (the old behavior) would zero out every badge
-- before they ever saw which category it was in. So "seen" now happens
-- when a category is actually opened, and profiles.forum_last_seen_at
-- (0048) is superseded by this table -- left in place, unused, rather than
-- dropped.

create table forum_category_last_seen (
  user_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references forum_categories(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table forum_category_last_seen enable row level security;

create policy "users manage their own forum read state"
  on forum_category_last_seen for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop function if exists get_forum_notification_count();

-- One row per category, same admin-vs-member rules as before (0048) but
-- scoped to that category's own last-seen instead of one global cursor.
create or replace function get_forum_notification_counts()
returns table (category_id uuid, unread_count integer)
language plpgsql
security definer set search_path = public
as $$
declare
  me profiles%rowtype;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then
    return;
  end if;

  if me.is_admin then
    return query
      select c.id,
        (select count(*)::integer
         from forum_threads t
         where t.category_id = c.id
           and t.status = 'visible'
           and t.created_at > coalesce(
             (select s.last_seen_at from forum_category_last_seen s
              where s.user_id = me.id and s.category_id = c.id),
             'epoch'::timestamptz
           ))
      from forum_categories c;
  else
    return query
      select c.id,
        (
          (select count(*)
           from forum_threads t
           join profiles a on a.id = t.author_id
           where t.category_id = c.id and t.status = 'visible' and a.is_admin
             and t.created_at > coalesce(
               (select s.last_seen_at from forum_category_last_seen s
                where s.user_id = me.id and s.category_id = c.id),
               'epoch'::timestamptz
             ))
          +
          (select count(*)
           from forum_replies r
           join forum_threads t on t.id = r.thread_id
           where t.category_id = c.id and r.status = 'visible'
             and t.author_id = me.id and r.author_id <> me.id
             and r.created_at > coalesce(
               (select s.last_seen_at from forum_category_last_seen s
                where s.user_id = me.id and s.category_id = c.id),
               'epoch'::timestamptz
             ))
        )::integer
      from forum_categories c;
  end if;
end;
$$;

grant execute on function get_forum_notification_counts() to authenticated;

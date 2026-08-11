-- Admin visibility: total signup count + email/name, for the app owner only.
-- Email lives in the protected auth.users table, not the app's public
-- profiles table, so we capture it at signup time via the existing trigger
-- and expose it only through a SECURITY DEFINER RPC gated on an is_admin
-- flag -- never through a broadened RLS policy.

alter table profiles add column if not exists email text;
alter table profiles add column if not exists is_admin boolean not null default false;

-- Backfill email for accounts that signed up before this column existed.
update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role, avatar_emoji, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'role',
    case new.raw_user_meta_data ->> 'role'
      when 'wife' then '👰'
      when 'husband' then '🤵'
      else '🙂'
    end,
    new.email
  );
  return new;
end;
$$;

update profiles set is_admin = true where email = 'garygonzo.gg@gmail.com';

create or replace function admin_list_users()
returns table (id uuid, display_name text, email text, role text, created_at timestamptz)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorized';
  end if;

  return query
    select p.id, p.display_name, p.email, p.role, p.created_at
    from profiles p
    order by p.created_at desc;
end;
$$;

grant execute on function admin_list_users() to authenticated;

-- Explicit wife/husband roles, set at signup (two separate registration
-- paths in the client) and enforced so a household can't end up with two of
-- the same role. Assumes no existing rows yet (pre-launch) -- adding a
-- not-null column with no default would otherwise need a backfill.
alter table profiles add column role text not null check (role in ('wife', 'husband'));

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'role'
  );
  return new;
end;
$$;

-- Joining now also rejects a second account with the same role as an
-- existing member of the target household.
create or replace function join_household(code text)
returns households
language plpgsql
security definer set search_path = public
as $$
declare
  target households;
  caller_role text;
begin
  select * into target from households where invite_code = upper(code);
  if target.id is null then
    raise exception 'Invalid invite code';
  end if;

  select role into caller_role from profiles where id = auth.uid();

  if exists (
    select 1
    from household_members hm
    join profiles p on p.id = hm.user_id
    where hm.household_id = target.id and p.role = caller_role
  ) then
    raise exception 'This household already has a % account in it.', caller_role;
  end if;

  insert into household_members (household_id, user_id) values (target.id, auth.uid())
  on conflict (household_id, user_id) do nothing;

  return target;
end;
$$;

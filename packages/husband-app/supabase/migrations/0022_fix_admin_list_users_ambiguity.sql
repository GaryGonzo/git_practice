-- admin_list_users() declares RETURNS TABLE (id uuid, ...), which implicitly
-- creates an "id" variable in scope for the whole function body -- the
-- authorization check's bare "where id = auth.uid()" collided with it,
-- so every call failed with "column reference \"id\" is ambiguous" before
-- ever reaching the actual query. Qualifying with the table alias fixes it.

create or replace function admin_list_users()
returns table (id uuid, display_name text, email text, role text, created_at timestamptz)
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'not authorized';
  end if;

  return query
    select p.id, p.display_name, p.email, p.role, p.created_at
    from profiles p
    order by p.created_at desc;
end;
$$;

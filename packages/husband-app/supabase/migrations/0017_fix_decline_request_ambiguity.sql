-- decline_request's "note" parameter collided with the requests.note
-- column (the original request's note, e.g. "oat milk latte, extra hot") --
-- inside the function body, bare "note" was ambiguous between the two,
-- so every decline on a request has always failed with "column reference
-- "note" is ambiguous". Postgres won't let create-or-replace rename a
-- parameter, so the old signature has to be dropped first.

drop function if exists decline_request(uuid, text);

create function decline_request(target_request_id uuid, decline_reason text default null)
returns requests
language plpgsql
security definer set search_path = public
as $$
declare
  updated_request requests;
begin
  select * into updated_request from requests where id = target_request_id;
  if updated_request.id is null then
    raise exception 'Request not found';
  end if;
  if not is_household_member(updated_request.household_id) then
    raise exception 'Not a member of this household';
  end if;

  update requests set status = 'declined', decline_note = decline_reason
  where id = target_request_id
  returning * into updated_request;

  return updated_request;
end;
$$;

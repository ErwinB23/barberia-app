-- Allow authenticated users to edit only the public presentation fields.
grant update (display_name, bio, photo_url)
on table public.barbers
to authenticated;

create policy barbers_update_public_profile
on public.barbers
for update
to authenticated
using (
  private.is_own_barber(id)
  or private.is_barbershop_admin(barbershop_id)
)
with check (
  private.is_own_barber(id)
  or private.is_barbershop_admin(barbershop_id)
);

-- Resolve only the caller's barber profile in one requested barbershop.
-- SECURITY DEFINER is intentionally narrow so user_id remains private.
create or replace function public.get_own_barber_profile(
  p_barbershop_id uuid
)
returns table (
  barber_id uuid,
  is_active boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  return query
  select
    barber.id as barber_id,
    barber.is_active
  from public.barbers as barber
  where barber.barbershop_id = p_barbershop_id
    and barber.user_id = v_user_id;
end;
$$;

revoke execute
on function public.get_own_barber_profile(uuid)
from public;

revoke execute
on function public.get_own_barber_profile(uuid)
from anon;

grant execute
on function public.get_own_barber_profile(uuid)
to authenticated;

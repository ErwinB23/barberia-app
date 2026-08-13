-- Operational staff can read only the client contact required for an assigned
-- reservation. The function intentionally returns no row when authorization
-- fails so arbitrary reservation identifiers do not reveal existence.
create or replace function public.get_reservation_client_contact(
  p_reservation_id uuid
)
returns table (
  full_name text,
  phone text
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
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  return query
  select
    profile.full_name,
    profile.phone
  from public.reservations as reservation
  inner join public.profiles as profile
    on profile.id = reservation.client_id
  where reservation.id = p_reservation_id
    and (
      private.is_own_barber(reservation.barber_id)
      or private.is_barbershop_admin(reservation.barbershop_id)
    );
end;
$$;

revoke execute
on function public.get_reservation_client_contact(uuid)
from public, anon;

grant execute
on function public.get_reservation_client_contact(uuid)
to authenticated;


-- A client with an existing pending Yape payment can keep reading the minimum
-- payment instructions even if the barbershop is later unpublished.
create or replace function public.get_reservation_yape_settings(
  p_reservation_id uuid
)
returns table (
  yape_holder_name text,
  yape_phone text,
  yape_qr_url text
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
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  return query
  select
    settings.yape_holder_name,
    settings.yape_phone,
    settings.yape_qr_url
  from public.reservations as reservation
  inner join public.payments as payment
    on payment.reservation_id = reservation.id
   and payment.barbershop_id = reservation.barbershop_id
  inner join public.barbershop_payment_settings as settings
    on settings.barbershop_id = reservation.barbershop_id
  where reservation.id = p_reservation_id
    and reservation.client_id = v_user_id
    and reservation.status in ('confirmed', 'in_progress', 'completed')
    and payment.method = 'yape'
    and payment.status = 'pending';
end;
$$;

revoke execute
on function public.get_reservation_yape_settings(uuid)
from public, anon;

grant execute
on function public.get_reservation_yape_settings(uuid)
to authenticated;

-- Return availability for an existing reservation using its immutable
-- duration and buffer snapshots. This intentionally remains separate from
-- get_available_slots, which validates a new booking against the live catalog.
create or replace function public.get_reschedule_available_slots(
  p_reservation_id uuid,
  p_new_barber_id uuid,
  p_date date
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_reservation public.reservations%rowtype;
  v_service_ids uuid[];
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select reservation.*
  into v_reservation
  from public.reservations as reservation
  where reservation.id = p_reservation_id;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if not (
    v_reservation.client_id = v_user_id
    or private.is_barbershop_admin(
      v_reservation.barbershop_id
    )
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  if v_reservation.status <> 'confirmed' then
    raise exception
      'Only confirmed reservations can be rescheduled'
      using errcode = '22023';
  end if;

  if v_reservation.starts_at <= now() then
    raise exception 'Reservation has already started'
      using errcode = '22023';
  end if;

  if v_reservation.reschedule_count >= 1 then
    raise exception
      'Reservation has already been rescheduled once'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.barbers as barber
    inner join public.barbershop_memberships as membership
      on membership.barbershop_id = barber.barbershop_id
     and membership.user_id = barber.user_id
    where barber.id = p_new_barber_id
      and barber.barbershop_id =
        v_reservation.barbershop_id
      and barber.is_active = true
      and membership.status = 'active'
  ) then
    raise exception 'New barber is not available'
      using errcode = 'P0002';
  end if;

  select array_agg(
    reservation_service.service_id
    order by reservation_service.service_id
  )
  into v_service_ids
  from public.reservation_services as reservation_service
  where reservation_service.reservation_id =
    p_reservation_id
    and reservation_service.barbershop_id =
      v_reservation.barbershop_id;

  if v_service_ids is null then
    raise exception 'Reservation has no services'
      using errcode = '23514';
  end if;

  return query
  select
    slot.starts_at,
    slot.ends_at
  from private.get_available_slots_impl(
    p_new_barber_id,
    v_service_ids,
    p_date,
    v_reservation.total_duration_minutes,
    v_reservation.buffer_minutes_at_booking,
    false,
    p_reservation_id
  ) as slot;
end;
$$;

revoke execute
on function public.get_reschedule_available_slots(
  uuid,
  uuid,
  date
)
from public, anon;

grant execute
on function public.get_reschedule_available_slots(
  uuid,
  uuid,
  date
)
to authenticated;

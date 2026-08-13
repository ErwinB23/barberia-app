create extension if not exists pg_cron
  with schema pg_catalog;


create index reservations_confirmed_starts_at_idx
  on public.reservations (starts_at)
  where status = 'confirmed';


create table private.reservation_reminder_deliveries (
  reservation_id uuid not null
    references public.reservations(id) on delete cascade,

  reservation_starts_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint reservation_reminder_deliveries_pkey
    primary key (reservation_id, reservation_starts_at)
);


revoke all
on table private.reservation_reminder_deliveries
from public, anon, authenticated;


create or replace function private.process_reservation_reminders()
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_inserted_count bigint;
begin
  with due_reservations as materialized (
    select
      reservation.id,
      reservation.client_id,
      reservation.barbershop_id,
      reservation.starts_at
    from public.reservations as reservation
    where reservation.status = 'confirmed'
      and reservation.starts_at > now()
      and reservation.starts_at <= now() + interval '1 hour'
    for update of reservation skip locked
  ),
  claimed_deliveries as (
    insert into private.reservation_reminder_deliveries (
      reservation_id,
      reservation_starts_at
    )
    select
      due.id,
      due.starts_at
    from due_reservations as due
    on conflict do nothing
    returning reservation_id, reservation_starts_at
  )
  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id
  )
  select
    due.client_id,
    due.barbershop_id,
    'reservation_reminder',
    'Tu cita es pronto',
    'Tu cita comienza aproximadamente a las '
      || to_char(
        due.starts_at at time zone 'America/Lima',
        'HH24:MI'
      )
      || '.',
    due.id
  from due_reservations as due
  inner join claimed_deliveries as claimed
    on claimed.reservation_id = due.id
   and claimed.reservation_starts_at = due.starts_at;

  get diagnostics v_inserted_count = row_count;

  return v_inserted_count;
end;
$$;


revoke execute
on function private.process_reservation_reminders()
from public, anon, authenticated;


select cron.schedule(
  'reservation-reminder-1h',
  '*/5 * * * *',
  'select private.process_reservation_reminders();'
);

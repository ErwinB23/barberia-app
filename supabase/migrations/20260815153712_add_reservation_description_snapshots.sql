alter table public.reservations
  add column barbershop_name_snapshot text,
  add column barber_display_name_snapshot text;

alter table public.reservation_services
  add column service_name_snapshot text,
  add column style_name_snapshot text;

comment on column public.reservations.barbershop_name_snapshot is
  'Nombre de la barberia conservado al crear la reserva.';

comment on column public.reservations.barber_display_name_snapshot is
  'Nombre visible del barbero asignado; cambia solo al reasignar la reserva.';

comment on column public.reservation_services.service_name_snapshot is
  'Nombre del servicio contratado conservado al crear la reserva.';

comment on column public.reservation_services.style_name_snapshot is
  'Nombre opcional del estilo contratado conservado al crear la reserva.';


-- Las claves foraneas existentes usan ON DELETE RESTRICT para barberias,
-- barberos, servicios y estilos referenciados por reservas. Por ello todos
-- los nombres obligatorios existentes siguen siendo resolubles.
update public.reservations as reservation
set
  barbershop_name_snapshot = barbershop.name,
  barber_display_name_snapshot = barber.display_name
from public.barbershops as barbershop,
     public.barbers as barber
where barbershop.id = reservation.barbershop_id
  and barber.id = reservation.barber_id
  and barber.barbershop_id = reservation.barbershop_id;

update public.reservation_services as reservation_service
set service_name_snapshot = service.name
from public.services as service
where service.id = reservation_service.service_id
  and service.barbershop_id = reservation_service.barbershop_id;

update public.reservation_services as reservation_service
set style_name_snapshot = style.name
from public.styles as style
where style.id = reservation_service.style_id
  and style.service_id = reservation_service.service_id;

do $$
begin
  if exists (
    select 1
    from public.reservations as reservation
    where reservation.barbershop_name_snapshot is null
       or reservation.barber_display_name_snapshot is null
  ) then
    raise exception 'Unable to backfill reservation description snapshots';
  end if;

  if exists (
    select 1
    from public.reservation_services as reservation_service
    where reservation_service.service_name_snapshot is null
       or (
         reservation_service.style_id is not null
         and reservation_service.style_name_snapshot is null
       )
  ) then
    raise exception 'Unable to backfill reservation service description snapshots';
  end if;
end;
$$;

alter table public.reservations
  alter column barbershop_name_snapshot set not null,
  alter column barber_display_name_snapshot set not null,
  add constraint reservations_barbershop_name_snapshot_check
    check (
      char_length(trim(barbershop_name_snapshot)) between 2 and 120
    ),
  add constraint reservations_barber_name_snapshot_check
    check (
      char_length(trim(barber_display_name_snapshot)) between 2 and 120
    );

alter table public.reservation_services
  alter column service_name_snapshot set not null,
  add constraint reservation_services_service_name_snapshot_check
    check (
      char_length(trim(service_name_snapshot)) between 2 and 120
    ),
  add constraint reservation_services_style_name_snapshot_check
    check (
      (
        style_id is null
        and style_name_snapshot is null
      )
      or
      (
        style_id is not null
        and char_length(trim(style_name_snapshot)) between 2 and 120
      )
    );


create or replace function private.set_reservation_description_snapshots()
returns trigger
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_barbershop_name text;
  v_barber_display_name text;
begin
  if tg_op = 'INSERT' then
    select barbershop.name, barber.display_name
    into v_barbershop_name, v_barber_display_name
    from public.barbershops as barbershop
    inner join public.barbers as barber
      on barber.barbershop_id = barbershop.id
    where barbershop.id = new.barbershop_id
      and barber.id = new.barber_id;

    if not found then
      raise exception 'Reservation description source not found'
        using errcode = '23503';
    end if;

    new.barbershop_name_snapshot := v_barbershop_name;
    new.barber_display_name_snapshot := v_barber_display_name;
  else
    new.barbershop_name_snapshot := old.barbershop_name_snapshot;

    if new.barber_id is distinct from old.barber_id then
      select barber.display_name
      into v_barber_display_name
      from public.barbers as barber
      where barber.id = new.barber_id
        and barber.barbershop_id = new.barbershop_id;

      if not found then
        raise exception 'Reservation barber description source not found'
          using errcode = '23503';
      end if;

      new.barber_display_name_snapshot := v_barber_display_name;
    else
      new.barber_display_name_snapshot := old.barber_display_name_snapshot;
    end if;
  end if;

  return new;
end;
$$;

revoke execute
on function private.set_reservation_description_snapshots()
from public, anon, authenticated;

create trigger reservations_set_description_snapshots
before insert or update on public.reservations
for each row
execute function private.set_reservation_description_snapshots();


create or replace function private.set_reservation_service_description_snapshots()
returns trigger
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_service_name text;
  v_style_name text;
begin
  if tg_op = 'INSERT' then
    select service.name
    into v_service_name
    from public.services as service
    where service.id = new.service_id
      and service.barbershop_id = new.barbershop_id;

    if not found then
      raise exception 'Reservation service description source not found'
        using errcode = '23503';
    end if;

    if new.style_id is not null then
      select style.name
      into v_style_name
      from public.styles as style
      where style.id = new.style_id
        and style.service_id = new.service_id;

      if not found then
        raise exception 'Reservation style description source not found'
          using errcode = '23503';
      end if;
    end if;

    new.service_name_snapshot := v_service_name;
    new.style_name_snapshot := v_style_name;
  else
    new.service_name_snapshot := old.service_name_snapshot;
    new.style_name_snapshot := old.style_name_snapshot;
  end if;

  return new;
end;
$$;

revoke execute
on function private.set_reservation_service_description_snapshots()
from public, anon, authenticated;

create trigger reservation_services_set_description_snapshots
before insert or update on public.reservation_services
for each row
execute function private.set_reservation_service_description_snapshots();

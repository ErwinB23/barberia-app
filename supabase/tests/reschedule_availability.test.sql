begin;

create extension if not exists pgtap with schema extensions;

set local timezone = 'America/Lima';

select plan(9);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '12000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'reschedule.client@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reschedule Client"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'reschedule.other@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Other Client"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'reschedule.admin@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reschedule Admin"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'reschedule.barber1@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reschedule Barber One"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'reschedule.barber2@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reschedule Barber Two"}',
    now(),
    now()
  );

insert into public.barbershops (id, created_by, name, status)
values (
  '22000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000003',
  'Reschedule Barbershop',
  'published'
);

insert into public.barbershop_settings (
  barbershop_id,
  appointment_buffer_minutes,
  min_booking_notice_minutes,
  max_booking_days,
  slot_interval_minutes
)
values (
  '22000000-0000-0000-0000-000000000001',
  60,
  60,
  15,
  15
);

insert into public.barbershop_memberships (
  id,
  barbershop_id,
  user_id,
  role,
  status
)
values
  (
    '32000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000003',
    'administrator',
    'active'
  ),
  (
    '32000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000004',
    'barber',
    'active'
  ),
  (
    '32000000-0000-0000-0000-000000000003',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000005',
    'barber',
    'active'
  );

insert into public.barbers (id, barbershop_id, user_id, display_name, is_active)
values
  (
    '42000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000004',
    'Reschedule Barber One',
    true
  ),
  (
    '42000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000005',
    'Reschedule Barber Two',
    true
  );

insert into public.services (
  id,
  barbershop_id,
  name,
  price,
  duration_minutes,
  is_active
)
values (
  '52000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000001',
  'Snapshot Service',
  30,
  30,
  true
);

insert into public.barber_services (barbershop_id, barber_id, service_id)
values (
  '22000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001',
  '52000000-0000-0000-0000-000000000001'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

insert into public.barbershop_hours (
  barbershop_id,
  weekday,
  start_time,
  end_time
)
values (
  '22000000-0000-0000-0000-000000000001',
  extract(dow from current_date + 5)::smallint,
  time '08:00',
  time '15:00'
);

insert into public.barber_schedules (
  barbershop_id,
  barber_id,
  weekday,
  start_time,
  end_time
)
select
  '22000000-0000-0000-0000-000000000001',
  barber.id,
  extract(dow from current_date + 5)::smallint,
  time '09:00',
  time '14:00'
from public.barbers as barber
where barber.barbershop_id = '22000000-0000-0000-0000-000000000001';

reset role;

insert into public.reservations (
  id,
  barbershop_id,
  client_id,
  barber_id,
  starts_at,
  ends_at,
  occupied_until,
  status,
  total_price,
  total_duration_minutes,
  buffer_minutes_at_booking,
  reschedule_count
)
values
  (
    '62000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '42000000-0000-0000-0000-000000000001',
    ((current_date + 5) + time '10:00') at time zone 'America/Lima',
    ((current_date + 5) + time '10:30') at time zone 'America/Lima',
    ((current_date + 5) + time '10:45') at time zone 'America/Lima',
    'confirmed',
    30,
    30,
    15,
    0
  ),
  (
    '62000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000002',
    '42000000-0000-0000-0000-000000000001',
    ((current_date + 5) + time '11:00') at time zone 'America/Lima',
    ((current_date + 5) + time '11:30') at time zone 'America/Lima',
    ((current_date + 5) + time '11:45') at time zone 'America/Lima',
    'confirmed',
    30,
    30,
    15,
    0
  );

insert into public.reservation_services (
  id,
  reservation_id,
  barbershop_id,
  service_id,
  price_at_booking,
  duration_at_booking
)
values
  (
    '72000000-0000-0000-0000-000000000001',
    '62000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    '52000000-0000-0000-0000-000000000001',
    30,
    30
  ),
  (
    '72000000-0000-0000-0000-000000000002',
    '62000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    '52000000-0000-0000-0000-000000000001',
    30,
    30
  );

-- Change live catalog values after the reservation snapshots already exist.
update public.services
set duration_minutes = 120,
    is_active = false
where id = '52000000-0000-0000-0000-000000000001';

select to_regprocedure(
  'public.get_reschedule_available_slots(uuid,uuid,date)'
) is not null as rpc_exists \gset

select ok(
  :'rpc_exists'::boolean,
  'existe la RPC publica de disponibilidad para reprogramacion'
);

\if :rpc_exists

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select ends_at
    from public.get_reschedule_available_slots(
      '62000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000001',
      current_date + 5
    )
    where starts_at =
      ((current_date + 5) + time '09:00') at time zone 'America/Lima'
  $$,
  $$
    values (
      ((current_date + 5) + time '09:30') at time zone 'America/Lima'
    )
  $$,
  'la disponibilidad de reprogramacion usa la duracion snapshot'
);

select isnt_empty(
  $$
    select 1
    from public.get_reschedule_available_slots(
      '62000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000001',
      current_date + 5
    )
  $$,
  'un servicio historico inactivo conserva disponibilidad de reprogramacion'
);

select isnt_empty(
  $$
    select 1
    from public.get_reschedule_available_slots(
      '62000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000001',
      current_date + 5
    )
    where starts_at =
      ((current_date + 5) + time '10:00') at time zone 'America/Lima'
  $$,
  'la reserva original no bloquea sus propios slots'
);

select is_empty(
  $$
    select 1
    from public.get_reschedule_available_slots(
      '62000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000001',
      current_date + 5
    )
    where starts_at =
      ((current_date + 5) + time '11:00') at time zone 'America/Lima'
  $$,
  'otra reserva activa bloquea el slot ocupado'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.get_reschedule_available_slots(
      '62000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000001',
      current_date + 5
    )
  $$,
  '42501',
  null::text,
  'un cliente no puede consultar la reprogramacion de una reserva ajena'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select *
    from public.get_reschedule_available_slots(
      '62000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000002',
      current_date + 5
    )
  $$,
  '22023',
  null::text,
  'el nuevo barbero debe realizar todos los servicios originales'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select isnt_empty(
  $$
    select 1
    from public.get_reschedule_available_slots(
      '62000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000001',
      current_date + 5
    )
  $$,
  'el administrador de la barberia puede consultar disponibilidad'
);

reset role;

select ok(
  has_function_privilege(
    'authenticated',
    'public.get_reschedule_available_slots(uuid,uuid,date)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.get_reschedule_available_slots(uuid,uuid,date)',
    'execute'
  ),
  'solo authenticated recibe EXECUTE sobre la RPC'
);

\else

select ok(false, 'snapshot pendiente hasta crear la RPC');
select ok(false, 'servicio inactivo pendiente hasta crear la RPC');
select ok(false, 'exclusion propia pendiente hasta crear la RPC');
select ok(false, 'conflicto ajeno pendiente hasta crear la RPC');
select ok(false, 'autorizacion del cliente pendiente hasta crear la RPC');
select ok(false, 'servicios del nuevo barbero pendientes hasta crear la RPC');
select ok(false, 'autorizacion del administrador pendiente hasta crear la RPC');
select ok(false, 'privilegios EXECUTE pendientes hasta crear la RPC');

\endif

select * from finish();

rollback;

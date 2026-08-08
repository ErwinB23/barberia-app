begin;

create extension if not exists pgtap with schema extensions;

set local timezone = 'America/Lima';

select plan(31);

-- Usuarios de prueba. El trigger de Auth crea sus perfiles públicos.
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
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'cliente1@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cliente Uno"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'cliente2@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cliente Dos"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'admin.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin A"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'barbero.a1@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barbero A1"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'barbero.a2@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barbero A2"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'admin.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin B"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    'authenticated',
    'authenticated',
    'barbero.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barbero B"}',
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    'authenticated',
    'authenticated',
    'cliente3@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cliente Tres"}',
    now(),
    now()
  );

insert into public.barbershops (
  id,
  created_by,
  name,
  phone,
  address,
  status
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'Barbería A',
    '999111111',
    'Dirección A',
    'published'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000006',
    'Barbería B',
    '999222222',
    'Dirección B',
    'published'
  );

insert into public.barbershop_settings (barbershop_id)
values
  ('20000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002');

insert into public.barbershop_memberships (
  id,
  barbershop_id,
  user_id,
  role,
  status
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'administrator',
    'active'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'barber',
    'active'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000005',
    'barber',
    'active'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000006',
    'administrator',
    'active'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000007',
    'barber',
    'active'
  );

insert into public.barbers (
  id,
  barbershop_id,
  user_id,
  display_name,
  is_active
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'Barbero A1',
    true
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000005',
    'Barbero A2',
    true
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000007',
    'Barbero B',
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
values
  (
    '50000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Corte A',
    30,
    30,
    true
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'Servicio no asignado',
    25,
    30,
    true
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    'Corte B',
    35,
    30,
    true
  );

insert into public.barber_services (
  barbershop_id,
  barber_id,
  service_id
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000003'
  );

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"admin.a@test.local"}',
  true
);
set local role authenticated;

insert into public.barbershop_hours (
  barbershop_id,
  weekday,
  start_time,
  end_time
)
select
  '20000000-0000-0000-0000-000000000001',
  weekday.value,
  time '08:00',
  time '18:00'
from generate_series(0, 6) as weekday(value);

insert into public.barber_schedules (
  barbershop_id,
  barber_id,
  weekday,
  start_time,
  end_time
)
select
  barber.barbershop_id,
  barber.id,
  weekday.value,
  time '09:00',
  time '17:00'
from public.barbers as barber
cross join generate_series(0, 6) as weekday(value)
where barber.barbershop_id = '20000000-0000-0000-0000-000000000001';

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000006","role":"authenticated","email":"admin.b@test.local"}',
  true
);
set local role authenticated;

insert into public.barbershop_hours (
  barbershop_id,
  weekday,
  start_time,
  end_time
)
select
  '20000000-0000-0000-0000-000000000002',
  weekday.value,
  time '08:00',
  time '18:00'
from generate_series(0, 6) as weekday(value);

insert into public.barber_schedules (
  barbershop_id,
  barber_id,
  weekday,
  start_time,
  end_time
)
select
  barber.barbershop_id,
  barber.id,
  weekday.value,
  time '09:00',
  time '17:00'
from public.barbers as barber
cross join generate_series(0, 6) as weekday(value)
where barber.barbershop_id = '20000000-0000-0000-0000-000000000002';

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
  reschedule_count,
  rescheduled_at,
  previous_starts_at,
  previous_barber_id
)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    ((current_date + 5) + time '10:00') at time zone 'America/Lima',
    ((current_date + 5) + time '10:30') at time zone 'America/Lima',
    ((current_date + 5) + time '10:45') at time zone 'America/Lima',
    'confirmed',
    30,
    30,
    15,
    0,
    null,
    null,
    null
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    ((current_date + 6) + time '10:00') at time zone 'America/Lima',
    ((current_date + 6) + time '10:30') at time zone 'America/Lima',
    ((current_date + 6) + time '10:45') at time zone 'America/Lima',
    'confirmed',
    30,
    30,
    15,
    0,
    null,
    null,
    null
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000003',
    ((current_date + 5) + time '10:00') at time zone 'America/Lima',
    ((current_date + 5) + time '10:30') at time zone 'America/Lima',
    ((current_date + 5) + time '10:45') at time zone 'America/Lima',
    'confirmed',
    35,
    30,
    15,
    0,
    null,
    null,
    null
  ),
  (
    '60000000-0000-0000-0000-000000000010',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    ((current_date + 7) + time '12:00') at time zone 'America/Lima',
    ((current_date + 7) + time '12:30') at time zone 'America/Lima',
    ((current_date + 7) + time '12:45') at time zone 'America/Lima',
    'confirmed',
    30,
    30,
    15,
    0,
    null,
    null,
    null
  ),
  (
    '60000000-0000-0000-0000-000000000011',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    ((current_date + 8) + time '12:00') at time zone 'America/Lima',
    ((current_date + 8) + time '12:30') at time zone 'America/Lima',
    ((current_date + 8) + time '12:45') at time zone 'America/Lima',
    'confirmed',
    30,
    30,
    15,
    0,
    null,
    null,
    null
  ),
  (
    '60000000-0000-0000-0000-000000000012',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    ((current_date + 9) + time '12:00') at time zone 'America/Lima',
    ((current_date + 9) + time '12:30') at time zone 'America/Lima',
    ((current_date + 9) + time '12:45') at time zone 'America/Lima',
    'confirmed',
    30,
    30,
    15,
    1,
    now(),
    ((current_date + 8) + time '12:00') at time zone 'America/Lima',
    '40000000-0000-0000-0000-000000000001'
  ),
  (
    '60000000-0000-0000-0000-000000000020',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000008',
    '40000000-0000-0000-0000-000000000001',
    now() + interval '90 minutes',
    now() + interval '120 minutes',
    now() + interval '135 minutes',
    'confirmed',
    30,
    30,
    15,
    0,
    null,
    null,
    null
  ),
  (
    '60000000-0000-0000-0000-000000000021',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    now() + interval '90 minutes',
    now() + interval '120 minutes',
    now() + interval '135 minutes',
    'confirmed',
    30,
    30,
    15,
    0,
    null,
    null,
    null
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
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    30,
    30
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    30,
    30
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000003',
    35,
    30
  ),
  (
    '70000000-0000-0000-0000-000000000010',
    '60000000-0000-0000-0000-000000000010',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    30,
    30
  ),
  (
    '70000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000011',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    30,
    30
  ),
  (
    '70000000-0000-0000-0000-000000000012',
    '60000000-0000-0000-0000-000000000012',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    30,
    30
  ),
  (
    '70000000-0000-0000-0000-000000000020',
    '60000000-0000-0000-0000-000000000020',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    30,
    30
  ),
  (
    '70000000-0000-0000-0000-000000000021',
    '60000000-0000-0000-0000-000000000021',
    '20000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    30,
    30
  );

insert into public.payments (
  id,
  reservation_id,
  barbershop_id,
  method,
  status,
  amount,
  confirmed_by,
  confirmed_at
)
values
  (
    '80000000-0000-0000-0000-000000000010',
    '60000000-0000-0000-0000-000000000010',
    '20000000-0000-0000-0000-000000000001',
    'cash',
    'pending',
    30,
    null,
    null
  ),
  (
    '80000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000011',
    '20000000-0000-0000-0000-000000000001',
    'yape',
    'pending',
    30,
    null,
    null
  ),
  (
    '80000000-0000-0000-0000-000000000020',
    '60000000-0000-0000-0000-000000000020',
    '20000000-0000-0000-0000-000000000001',
    'cash',
    'paid',
    30,
    '10000000-0000-0000-0000-000000000003',
    now()
  ),
  (
    '80000000-0000-0000-0000-000000000021',
    '60000000-0000-0000-0000-000000000021',
    '20000000-0000-0000-0000-000000000001',
    'cash',
    'paid',
    30,
    '10000000-0000-0000-0000-000000000003',
    now()
  );

-- Administrador A: acceso propio y aislamiento frente a B.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"admin.a@test.local"}',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'admin A puede leer reservas de A'
);

select is(
  (
    select count(*)
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000003'
  ),
  0::bigint,
  'admin A no puede leer reservas privadas de B'
);

select is_empty(
  $$
    update public.services
    set name = 'Intento cruzado'
    where id = '50000000-0000-0000-0000-000000000003'
    returning 1
  $$,
  'admin A no puede modificar servicios de B'
);

select lives_ok(
  $$
    select public.update_barbershop(
      '20000000-0000-0000-0000-000000000001',
      'Barbería A Actualizada'
    )
  $$,
  'admin A puede gestionar su barbería'
);

select is(
  (
    select name
    from public.barbershops
    where id = '20000000-0000-0000-0000-000000000001'
  ),
  'Barbería A Actualizada'::text,
  'la gestión del admin A persiste en A'
);

select throws_ok(
  $$
    select public.update_barbershop(
      '20000000-0000-0000-0000-000000000002',
      'Intento sobre B'
    )
  $$,
  '42501',
  null::text,
  'admin A no puede gestionar B'
);

reset role;

-- Barbero A1: solo su agenda y nunca datos privados de B.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","email":"barbero.a1@test.local"}',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'barbero A1 puede leer una reserva asignada'
);

select is(
  (
    select count(*)
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000003'
  ),
  0::bigint,
  'barbero A1 no puede leer reservas privadas de B'
);

select throws_ok(
  $$
    select public.start_reservation(
      '60000000-0000-0000-0000-000000000002'
    )
  $$,
  '42501',
  null::text,
  'barbero A1 no puede operar una reserva asignada a A2'
);

reset role;

-- Cliente 1: solo sus reservas y sin escritura operativa directa.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","email":"cliente1@test.local"}',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.reservations
    where client_id = '10000000-0000-0000-0000-000000000001'
  ),
  2::bigint,
  'cliente puede leer sus propias reservas'
);

select is(
  (
    select count(*)
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000003'
  ),
  0::bigint,
  'cliente no puede leer la reserva de otro cliente'
);

select throws_ok(
  $$
    update public.reservations
    set status = 'completed'
    where id = '60000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null::text,
  'cliente no puede modificar estados operativos directamente'
);

select throws_ok(
  $$
    select public.create_reservation(
      '40000000-0000-0000-0000-000000000001',
      '[{"service_id":"50000000-0000-0000-0000-000000000001"}]'::jsonb,
      ((current_date + 4) + time '11:00') at time zone 'America/Lima',
      'cash'
    )
  $$,
  '23514',
  null::text,
  'cliente no puede superar dos reservas futuras activas'
);

reset role;

-- Restricciones de reservas independientes de RLS.
select throws_ok(
  $$
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
      buffer_minutes_at_booking
    )
    values (
      '60000000-0000-0000-0000-000000000099',
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000008',
      '40000000-0000-0000-0000-000000000001',
      ((current_date + 5) + time '10:00') at time zone 'America/Lima',
      ((current_date + 5) + time '10:30') at time zone 'America/Lima',
      ((current_date + 5) + time '10:45') at time zone 'America/Lima',
      'confirmed',
      30,
      30,
      15
    )
  $$,
  '23P01',
  null::text,
  'la base impide reservas solapadas del mismo barbero'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000008","role":"authenticated","email":"cliente3@test.local"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.create_reservation(
      '40000000-0000-0000-0000-000000000001',
      '[{"service_id":"50000000-0000-0000-0000-000000000002"}]'::jsonb,
      ((current_date + 4) + time '11:00') at time zone 'America/Lima',
      'cash'
    )
  $$,
  '22023',
  null::text,
  'la reserva exige que el barbero realice todos los servicios'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","email":"cliente2@test.local"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.reschedule_reservation(
      '60000000-0000-0000-0000-000000000012',
      '40000000-0000-0000-0000-000000000001',
      ((current_date + 10) + time '15:00') at time zone 'America/Lima'
    )
  $$,
  '23514',
  null::text,
  'una reserva solo puede reprogramarse una vez'
);

-- Pagos: cliente no confirma, efectivo por barbero y Yape por admin.
select throws_ok(
  $$
    select public.confirm_cash_payment(
      '60000000-0000-0000-0000-000000000010'
    )
  $$,
  '42501',
  null::text,
  'cliente no puede confirmar un pago en efectivo'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","email":"barbero.a1@test.local"}',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.confirm_cash_payment(
      '60000000-0000-0000-0000-000000000010'
    )
  $$,
  'barbero asignado puede confirmar efectivo'
);

reset role;

select is(
  (
    select status::text
    from public.payments
    where id = '80000000-0000-0000-0000-000000000010'
  ),
  'paid'::text,
  'el pago en efectivo queda pagado'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated","email":"barbero.a1@test.local"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.confirm_yape_payment(
      '60000000-0000-0000-0000-000000000011',
      'YAPE-TEST',
      null
    )
  $$,
  '42501',
  null::text,
  'barbero no puede confirmar Yape'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"admin.a@test.local"}',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.confirm_yape_payment(
      '60000000-0000-0000-0000-000000000011',
      'YAPE-TEST',
      null
    )
  $$,
  'administrador puede confirmar Yape'
);

reset role;

select is(
  (
    select status::text
    from public.payments
    where id = '80000000-0000-0000-0000-000000000011'
  ),
  'paid'::text,
  'el pago Yape queda pagado'
);

-- Cancelación tardía: la decisión financiera queda congelada.
update public.barbershop_settings
set late_cancellation_refund_policy = 'no_refund'
where barbershop_id = '20000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000008","role":"authenticated","email":"cliente3@test.local"}',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.cancel_reservation(
      '60000000-0000-0000-0000-000000000020'
    )
  $$,
  'cliente puede cancelar una reserva tardía'
);

reset role;

select is(
  (
    select refund_policy_at_late_action::text
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000020'
  ),
  'no_refund'::text,
  'cancelación tardía conserva snapshot no_refund'
);

select is(
  (
    select is_refund_eligible
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000020'
  ),
  false,
  'cancelación tardía no queda elegible para reembolso'
);

update public.barbershop_settings
set late_cancellation_refund_policy = 'full_refund'
where barbershop_id = '20000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"admin.a@test.local"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.refund_payment(
      '60000000-0000-0000-0000-000000000020'
    )
  $$,
  '22023',
  null::text,
  'cambiar la política después no habilita el reembolso'
);

reset role;

-- Reprogramación tardía: cancelar luego tampoco recupera el reembolso.
update public.barbershop_settings
set late_cancellation_refund_policy = 'no_refund'
where barbershop_id = '20000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","email":"cliente2@test.local"}',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.reschedule_reservation(
      '60000000-0000-0000-0000-000000000021',
      '40000000-0000-0000-0000-000000000001',
      ((current_date + 3) + time '14:00') at time zone 'America/Lima'
    )
  $$,
  'cliente puede reprogramar una vez dentro del plazo tardío'
);

reset role;

select is(
  (
    select refund_policy_at_late_action::text
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000021'
  ),
  'no_refund'::text,
  'reprogramación tardía conserva snapshot no_refund'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","email":"cliente2@test.local"}',
  true
);
set local role authenticated;

select lives_ok(
  $$
    select public.cancel_reservation(
      '60000000-0000-0000-0000-000000000021'
    )
  $$,
  'cliente puede cancelar después de reprogramar'
);

reset role;

select is(
  (
    select is_refund_eligible
    from public.reservations
    where id = '60000000-0000-0000-0000-000000000021'
  ),
  false,
  'cancelar después de reprogramar no recupera elegibilidad'
);

update public.barbershop_settings
set late_cancellation_refund_policy = 'full_refund'
where barbershop_id = '20000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","email":"admin.a@test.local"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.refund_payment(
      '60000000-0000-0000-0000-000000000021'
    )
  $$,
  '22023',
  null::text,
  'reprogramación tardía no permite recuperar el reembolso'
);

reset role;

select * from finish();

rollback;

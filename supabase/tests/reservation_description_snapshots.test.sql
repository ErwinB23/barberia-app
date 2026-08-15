begin;

create extension if not exists pgtap with schema extensions;

set local timezone = 'America/Lima';

select plan(26);

select has_column(
  'public',
  'reservations',
  'barbershop_name_snapshot',
  'reservations guarda el nombre historico de la barberia'
);

select has_column(
  'public',
  'reservations',
  'barber_display_name_snapshot',
  'reservations guarda el nombre visible historico del barbero'
);

select has_column(
  'public',
  'reservation_services',
  'service_name_snapshot',
  'reservation_services guarda el nombre historico del servicio'
);

select has_column(
  'public',
  'reservation_services',
  'style_name_snapshot',
  'reservation_services guarda el nombre historico opcional del estilo'
);

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
    '19000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'snapshots.client.one@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Snapshot Client One"}',
    now(),
    now()
  ),
  (
    '19000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'snapshots.client.two@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Snapshot Client Two"}',
    now(),
    now()
  ),
  (
    '19000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'snapshots.admin.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Snapshot Admin A"}',
    now(),
    now()
  ),
  (
    '19000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'snapshots.barber.one@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Snapshot Barber One"}',
    now(),
    now()
  ),
  (
    '19000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'snapshots.barber.two@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Snapshot Barber Two"}',
    now(),
    now()
  ),
  (
    '19000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'snapshots.admin.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Snapshot Admin B"}',
    now(),
    now()
  );

insert into public.barbershops (id, created_by, name, status)
values
  (
    '29000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000003',
    'Barberia Historica',
    'published'
  ),
  (
    '29000000-0000-0000-0000-000000000002',
    '19000000-0000-0000-0000-000000000006',
    'Barberia Aislada',
    'published'
  );

insert into public.barbershop_settings (barbershop_id)
values ('29000000-0000-0000-0000-000000000001');

insert into public.barbershop_memberships (
  id,
  barbershop_id,
  user_id,
  role,
  status
)
values
  (
    '39000000-0000-0000-0000-000000000001',
    '29000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000003',
    'administrator',
    'active'
  ),
  (
    '39000000-0000-0000-0000-000000000002',
    '29000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000004',
    'barber',
    'active'
  ),
  (
    '39000000-0000-0000-0000-000000000003',
    '29000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000005',
    'barber',
    'active'
  ),
  (
    '39000000-0000-0000-0000-000000000004',
    '29000000-0000-0000-0000-000000000002',
    '19000000-0000-0000-0000-000000000006',
    'administrator',
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
    '49000000-0000-0000-0000-000000000001',
    '29000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000004',
    'Barbero Historico Uno',
    true
  ),
  (
    '49000000-0000-0000-0000-000000000002',
    '29000000-0000-0000-0000-000000000001',
    '19000000-0000-0000-0000-000000000005',
    'Barbero Historico Dos',
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
  '59000000-0000-0000-0000-000000000001',
  '29000000-0000-0000-0000-000000000001',
  'Servicio Historico',
  40,
  30,
  true
);

insert into public.styles (id, service_id, name, is_active)
values (
  '69000000-0000-0000-0000-000000000001',
  '59000000-0000-0000-0000-000000000001',
  'Estilo Historico',
  true
);

insert into public.barber_services (barbershop_id, barber_id, service_id)
values
  (
    '29000000-0000-0000-0000-000000000001',
    '49000000-0000-0000-0000-000000000001',
    '59000000-0000-0000-0000-000000000001'
  ),
  (
    '29000000-0000-0000-0000-000000000001',
    '49000000-0000-0000-0000-000000000002',
    '59000000-0000-0000-0000-000000000001'
  );

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

insert into public.barbershop_hours (barbershop_id, weekday, start_time, end_time)
select
  '29000000-0000-0000-0000-000000000001',
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
where barber.barbershop_id = '29000000-0000-0000-0000-000000000001';

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select public.create_reservation(
  '49000000-0000-0000-0000-000000000001',
  '[{"service_id":"59000000-0000-0000-0000-000000000001","style_id":"69000000-0000-0000-0000-000000000001"}]'::jsonb,
  ((current_date + 3) + time '10:00') at time zone 'America/Lima',
  'cash'
) as historical_reservation_id \gset

select public.create_reservation(
  '49000000-0000-0000-0000-000000000001',
  '[{"service_id":"59000000-0000-0000-0000-000000000001"}]'::jsonb,
  ((current_date + 4) + time '10:00') at time zone 'America/Lima',
  'cash'
) as same_barber_reservation_id \gset

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select public.create_reservation(
  '49000000-0000-0000-0000-000000000001',
  '[{"service_id":"59000000-0000-0000-0000-000000000001"}]'::jsonb,
  ((current_date + 5) + time '10:00') at time zone 'America/Lima',
  'cash'
) as changed_barber_reservation_id \gset

reset role;

select isnt(
  :'historical_reservation_id'::uuid,
  null::uuid,
  'crear una reserva genera su identidad con snapshots backend'
);

select results_eq(
  format(
    'select barbershop_name_snapshot from public.reservations where id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Barberia Historica'::text) $$,
  'una reserva nueva guarda el nombre de la barberia'
);

select results_eq(
  format(
    'select barber_display_name_snapshot from public.reservations where id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Barbero Historico Uno'::text) $$,
  'una reserva nueva guarda el nombre visible del barbero'
);

select results_eq(
  format(
    'select service_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Servicio Historico'::text) $$,
  'una reserva nueva guarda el nombre del servicio'
);

select results_eq(
  format(
    'select style_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Estilo Historico'::text) $$,
  'una reserva nueva guarda el nombre del estilo seleccionado'
);

update public.barbershops
set name = 'Barberia Renombrada'
where id = '29000000-0000-0000-0000-000000000001';

update public.barbers
set display_name = 'Barbero Renombrado'
where id = '49000000-0000-0000-0000-000000000001';

update public.services
set name = 'Servicio Renombrado'
where id = '59000000-0000-0000-0000-000000000001';

update public.styles
set name = 'Estilo Renombrado'
where id = '69000000-0000-0000-0000-000000000001';

select results_eq(
  format(
    'select barbershop_name_snapshot from public.reservations where id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Barberia Historica'::text) $$,
  'renombrar la barberia no altera su snapshot historico'
);

select results_eq(
  format(
    'select service_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Servicio Historico'::text) $$,
  'renombrar el servicio no altera su snapshot historico'
);

select results_eq(
  format(
    'select style_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Estilo Historico'::text) $$,
  'renombrar el estilo no altera su snapshot historico'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  format(
    $$
      select public.reschedule_reservation(
        %L::uuid,
        '49000000-0000-0000-0000-000000000001',
        ((current_date + 4) + time '11:00') at time zone 'America/Lima'
      )
    $$,
    :'same_barber_reservation_id'
  ),
  'la reserva puede reprogramarse manteniendo el mismo barbero'
);

reset role;

select results_eq(
  format(
    'select barber_display_name_snapshot from public.reservations where id = %L::uuid',
    :'same_barber_reservation_id'
  ),
  $$ values ('Barbero Historico Uno'::text) $$,
  'reprogramar con el mismo barbero conserva su snapshot original'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  format(
    $$
      select public.reschedule_reservation(
        %L::uuid,
        '49000000-0000-0000-0000-000000000002',
        ((current_date + 5) + time '10:00') at time zone 'America/Lima'
      )
    $$,
    :'changed_barber_reservation_id'
  ),
  'la reserva puede reprogramarse con otro barbero elegible'
);

reset role;

select results_eq(
  format(
    'select barber_display_name_snapshot from public.reservations where id = %L::uuid',
    :'changed_barber_reservation_id'
  ),
  $$ values ('Barbero Historico Dos'::text) $$,
  'cambiar realmente de barbero actualiza solo su snapshot descriptivo'
);

select results_eq(
  format(
    'select service_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'changed_barber_reservation_id'
  ),
  $$ values ('Servicio Historico'::text) $$,
  'reprogramar con otro barbero conserva el snapshot del servicio'
);

update public.services
set is_active = false
where id = '59000000-0000-0000-0000-000000000001';

update public.styles
set is_active = false
where id = '69000000-0000-0000-0000-000000000001';

update public.barbers
set is_active = false
where id = '49000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select public.unpublish_barbershop(
  '29000000-0000-0000-0000-000000000001'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  format(
    'select service_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Servicio Historico'::text) $$,
  'desactivar el servicio no elimina su descripcion historica'
);

select results_eq(
  format(
    'select style_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Estilo Historico'::text) $$,
  'desactivar el estilo no elimina su descripcion historica'
);

select results_eq(
  format(
    'select barber_display_name_snapshot from public.reservations where id = %L::uuid',
    :'historical_reservation_id'
  ),
  $$ values ('Barbero Historico Uno'::text) $$,
  'desactivar el barbero no elimina su descripcion historica'
);

select results_eq(
  format(
    $$
      select barbershop_name_snapshot, barber_display_name_snapshot
      from public.reservations
      where id = %L::uuid
    $$,
    :'historical_reservation_id'
  ),
  $$ values ('Barberia Historica'::text, 'Barbero Historico Uno'::text) $$,
  'el cliente conserva las descripciones de su reserva al despublicar la barberia'
);

select throws_ok(
  $$
    select public.create_reservation(
      '49000000-0000-0000-0000-000000000001',
      '[{"service_id":"59000000-0000-0000-0000-000000000001","service_name_snapshot":"Nombre falso"}]'::jsonb,
      ((current_date + 6) + time '10:00') at time zone 'America/Lima',
      'cash'
    )
  $$,
  '22023',
  null::text,
  'el cliente no puede enviar snapshots descriptivos en el payload'
);

select throws_ok(
  format(
    $$
      update public.reservations
      set barbershop_name_snapshot = 'Nombre falso'
      where id = %L::uuid
    $$,
    :'historical_reservation_id'
  ),
  '42501',
  null::text,
  'el cliente no puede modificar snapshots de la reserva directamente'
);

select throws_ok(
  format(
    $$
      update public.reservation_services
      set service_name_snapshot = 'Nombre falso'
      where reservation_id = %L::uuid
    $$,
    :'historical_reservation_id'
  ),
  '42501',
  null::text,
  'el cliente no puede modificar snapshots de servicios directamente'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"19000000-0000-0000-0000-000000000006","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  format(
    'select barbershop_name_snapshot from public.reservations where id = %L::uuid',
    :'historical_reservation_id'
  ),
  'el administrador de otra barberia no puede leer la reserva'
);

select is_empty(
  format(
    'select service_name_snapshot from public.reservation_services where reservation_id = %L::uuid',
    :'historical_reservation_id'
  ),
  'el administrador de otra barberia no puede leer sus servicios historicos'
);

reset role;
select set_config('request.jwt.claims', '{}', true);

select * from finish();

rollback;

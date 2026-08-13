begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

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
    '18000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'reminders.admin@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reminders Admin"}',
    now(),
    now()
  ),
  (
    '18000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'reminders.barber@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reminders Barber"}',
    now(),
    now()
  ),
  (
    '18000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'reminders.client.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reminders Client A"}',
    now(),
    now()
  ),
  (
    '18000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'reminders.client.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Reminders Client B"}',
    now(),
    now()
  );

insert into public.barbershops (
  id,
  created_by,
  name,
  status
)
values (
  '28000000-0000-0000-0000-000000000001',
  '18000000-0000-0000-0000-000000000001',
  'Reminders Barbershop',
  'published'
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
    '38000000-0000-0000-0000-000000000001',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000001',
    'administrator',
    'active'
  ),
  (
    '38000000-0000-0000-0000-000000000002',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000002',
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
values (
  '48000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  '18000000-0000-0000-0000-000000000002',
  'Reminders Barber',
  true
);

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
  started_at,
  completed_at,
  cancelled_at,
  cancelled_by,
  no_show_at
)
values
  (
    '68000000-0000-0000-0000-000000000001',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000003',
    '48000000-0000-0000-0000-000000000001',
    now() + interval '55 minutes',
    now() + interval '56 minutes',
    now() + interval '56 minutes',
    'confirmed',
    10,
    1,
    0,
    null,
    null,
    null,
    null,
    null
  ),
  (
    '68000000-0000-0000-0000-000000000002',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000003',
    '48000000-0000-0000-0000-000000000001',
    now() + interval '45 minutes',
    now() + interval '46 minutes',
    now() + interval '46 minutes',
    'cancelled',
    10,
    1,
    0,
    null,
    null,
    now(),
    '18000000-0000-0000-0000-000000000003',
    null
  ),
  (
    '68000000-0000-0000-0000-000000000003',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000003',
    '48000000-0000-0000-0000-000000000001',
    now() + interval '35 minutes',
    now() + interval '36 minutes',
    now() + interval '36 minutes',
    'completed',
    10,
    1,
    0,
    now() - interval '10 minutes',
    now() - interval '5 minutes',
    null,
    null,
    null
  ),
  (
    '68000000-0000-0000-0000-000000000004',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000003',
    '48000000-0000-0000-0000-000000000001',
    now() + interval '25 minutes',
    now() + interval '26 minutes',
    now() + interval '26 minutes',
    'no_show',
    10,
    1,
    0,
    null,
    null,
    null,
    null,
    now()
  ),
  (
    '68000000-0000-0000-0000-000000000005',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000003',
    '48000000-0000-0000-0000-000000000001',
    now() + interval '15 minutes',
    now() + interval '16 minutes',
    now() + interval '16 minutes',
    'in_progress',
    10,
    1,
    0,
    now(),
    null,
    null,
    null,
    null
  ),
  (
    '68000000-0000-0000-0000-000000000006',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000003',
    '48000000-0000-0000-0000-000000000001',
    now() + interval '5 minutes',
    now() + interval '6 minutes',
    now() + interval '6 minutes',
    'confirmed',
    10,
    1,
    0,
    null,
    null,
    null,
    null,
    null
  ),
  (
    '68000000-0000-0000-0000-000000000007',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000004',
    '48000000-0000-0000-0000-000000000001',
    now() + interval '50 minutes',
    now() + interval '51 minutes',
    now() + interval '51 minutes',
    'confirmed',
    10,
    1,
    0,
    null,
    null,
    null,
    null,
    null
  );

select ok(
  to_regprocedure('private.process_reservation_reminders()') is not null,
  'existe la funcion privada procesadora'
);

select ok(
  to_regclass('private.reservation_reminder_deliveries') is not null,
  'existe el registro privado anti-duplicados'
);

select results_eq(
  $$
    select schedule, command
    from cron.job
    where jobname = 'reservation-reminder-1h'
  $$,
  $$
    values (
      '*/5 * * * *'::text,
      'select private.process_reservation_reminders();'::text
    )
  $$,
  'existe un job estable cada cinco minutos'
);

select ok(
  not has_function_privilege(
    'anon',
    'private.process_reservation_reminders()',
    'execute'
  ),
  'anon no puede ejecutar la funcion programada'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'private.process_reservation_reminders()',
    'execute'
  ),
  'authenticated no puede ejecutar la funcion programada'
);

select lives_ok(
  $$
    select private.process_reservation_reminders()
  $$,
  'la primera ejecucion procesa las reservas proximas'
);

select is(
  (
    select count(*)
    from public.notifications
    where reservation_id = '68000000-0000-0000-0000-000000000001'
      and type = 'reservation_reminder'
  ),
  1::bigint,
  'una reserva confirmada proxima genera una notificacion'
);

select results_eq(
  $$
    select reservation_id
    from public.notifications
    where reservation_id in (
      '68000000-0000-0000-0000-000000000002',
      '68000000-0000-0000-0000-000000000003',
      '68000000-0000-0000-0000-000000000004',
      '68000000-0000-0000-0000-000000000005'
    )
      and type = 'reservation_reminder'
  $$,
  $$
    select null::uuid
    where false
  $$,
  'cancelled completed no_show e in_progress no generan recordatorio'
);

select lives_ok(
  $$
    select private.process_reservation_reminders()
  $$,
  'la segunda ejecucion es idempotente'
);

select is(
  (
    select count(*)
    from public.notifications
    where reservation_id = '68000000-0000-0000-0000-000000000001'
      and type = 'reservation_reminder'
  ),
  1::bigint,
  'la segunda ejecucion no duplica el recordatorio'
);

update public.reservations
set
  previous_starts_at = starts_at,
  previous_barber_id = barber_id,
  starts_at = starts_at + interval '15 minutes',
  ends_at = ends_at + interval '15 minutes',
  occupied_until = occupied_until + interval '15 minutes',
  reschedule_count = 1,
  rescheduled_at = now()
where id = '68000000-0000-0000-0000-000000000006';

select lives_ok(
  $$
    select private.process_reservation_reminders()
  $$,
  'una ejecucion posterior procesa el nuevo horario reprogramado'
);

select is(
  (
    select count(*)
    from public.notifications
    where reservation_id = '68000000-0000-0000-0000-000000000006'
      and type = 'reservation_reminder'
  ),
  2::bigint,
  'una reprogramacion permite un recordatorio para cada starts_at'
);

select is(
  (
    select count(*)
    from private.reservation_reminder_deliveries
    where reservation_id = '68000000-0000-0000-0000-000000000006'
  ),
  2::bigint,
  'el registro privado conserva ambas identidades de entrega'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select ok(
  (
    select bool_and(user_id = '18000000-0000-0000-0000-000000000003')
    from public.notifications
    where type = 'reservation_reminder'
  ),
  'el cliente A solo recibe sus propias notificaciones'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select reservation_id
    from public.notifications
    where type = 'reservation_reminder'
  $$,
  $$
    values ('68000000-0000-0000-0000-000000000007'::uuid)
  $$,
  'el cliente B solo ve el recordatorio de su reserva'
);

reset role;
select set_config('request.jwt.claims', '{}', true);

select is(
  (
    select count(*)
    from public.notifications
    where reservation_id = '68000000-0000-0000-0000-000000000007'
      and user_id = '18000000-0000-0000-0000-000000000004'
      and type = 'reservation_reminder'
  ),
  1::bigint,
  'el recordatorio se persiste para el client_id correcto'
);

select * from finish();

rollback;

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

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
    '1a000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'notifications.owner@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Notifications Owner"}',
    now(),
    now()
  ),
  (
    '1a000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'notifications.other@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Notifications Other"}',
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
  '2a000000-0000-0000-0000-000000000001',
  '1a000000-0000-0000-0000-000000000001',
  'Notifications Barbershop',
  'published'
);

insert into public.barbershop_memberships (
  id,
  barbershop_id,
  user_id,
  role,
  status
)
values (
  '3a000000-0000-0000-0000-000000000001',
  '2a000000-0000-0000-0000-000000000001',
  '1a000000-0000-0000-0000-000000000001',
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
values (
  '4a000000-0000-0000-0000-000000000001',
  '2a000000-0000-0000-0000-000000000001',
  '1a000000-0000-0000-0000-000000000001',
  'Notifications Barber',
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
  buffer_minutes_at_booking
)
values (
  '6a000000-0000-0000-0000-000000000001',
  '2a000000-0000-0000-0000-000000000001',
  '1a000000-0000-0000-0000-000000000001',
  '4a000000-0000-0000-0000-000000000001',
  now() + interval '2 days',
  now() + interval '2 days 30 minutes',
  now() + interval '2 days 45 minutes',
  'confirmed',
  30,
  30,
  15
);

insert into public.payments (
  id,
  reservation_id,
  barbershop_id,
  method,
  status,
  amount
)
values (
  '8a000000-0000-0000-0000-000000000001',
  '6a000000-0000-0000-0000-000000000001',
  '2a000000-0000-0000-0000-000000000001',
  'cash',
  'pending',
  30
);

insert into public.barbershop_invitations (
  id,
  barbershop_id,
  invited_by,
  role,
  channel,
  recipient_user_id,
  email,
  status,
  expires_at
)
values (
  '9a000000-0000-0000-0000-000000000001',
  '2a000000-0000-0000-0000-000000000001',
  '1a000000-0000-0000-0000-000000000001',
  'barber',
  'app',
  '1a000000-0000-0000-0000-000000000002',
  'notifications.other@test.local',
  'pending',
  now() + interval '7 days'
);

insert into public.notifications (
  id,
  user_id,
  barbershop_id,
  type,
  title,
  message,
  is_read,
  read_at,
  reservation_id,
  payment_id,
  invitation_id
)
values
  (
    'aa000000-0000-0000-0000-000000000001',
    '1a000000-0000-0000-0000-000000000001',
    '2a000000-0000-0000-0000-000000000001',
    'reservation_created',
    'Notificacion descartable',
    'Esta notificacion conserva todo su contexto.',
    false,
    null,
    '6a000000-0000-0000-0000-000000000001',
    '8a000000-0000-0000-0000-000000000001',
    '9a000000-0000-0000-0000-000000000001'
  ),
  (
    'aa000000-0000-0000-0000-000000000002',
    '1a000000-0000-0000-0000-000000000001',
    '2a000000-0000-0000-0000-000000000001',
    'reservation_created',
    'Notificacion navegable',
    'Esta notificacion debe conservar su destino.',
    true,
    now(),
    '6a000000-0000-0000-0000-000000000001',
    null,
    null
  ),
  (
    'aa000000-0000-0000-0000-000000000003',
    '1a000000-0000-0000-0000-000000000002',
    null,
    'account_update',
    'Notificacion de otro usuario',
    'Solo su propietario puede descartarla.',
    false,
    null,
    null,
    null,
    null
  );

select has_column(
  'public',
  'notifications',
  'dismissed_at',
  'notifications permite registrar una eliminacion logica'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.notifications',
    'dismissed_at',
    'update'
  )
  and has_function_privilege(
    'authenticated',
    'public.dismiss_notification(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.dismiss_notification(uuid)',
    'execute'
  ),
  'solo authenticated puede usar la operacion estrecha de descarte'
);

select ok(
  not has_column_privilege('authenticated', 'public.notifications', 'user_id', 'update')
  and not has_column_privilege('authenticated', 'public.notifications', 'type', 'update')
  and not has_column_privilege('authenticated', 'public.notifications', 'title', 'update')
  and not has_column_privilege('authenticated', 'public.notifications', 'message', 'update')
  and not has_column_privilege('authenticated', 'public.notifications', 'reservation_id', 'update')
  and not has_column_privilege('authenticated', 'public.notifications', 'invitation_id', 'update')
  and not has_column_privilege('authenticated', 'public.notifications', 'payment_id', 'update'),
  'authenticated no puede alterar identidad contenido ni referencias'
);

select ok(
  not has_table_privilege('authenticated', 'public.notifications', 'delete'),
  'authenticated no recibe DELETE fisico sobre notifications'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"1a000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select public.dismiss_notification(
      'aa000000-0000-0000-0000-000000000001'
    )
  $$,
  $$ values (true) $$,
  'el propietario puede descartar su propia notificacion'
);

select is_empty(
  $$
    select id
    from public.notifications
    where id = 'aa000000-0000-0000-0000-000000000001'
  $$,
  'la notificacion descartada desaparece del listado autorizado'
);

select is(
  (
    select count(*)
    from public.notifications
    where is_read = false
  ),
  0::bigint,
  'la notificacion descartada deja de contar como no leida'
);

reset role;

select results_eq(
  $$
    select reservation_id, payment_id, invitation_id
    from public.notifications
    where id = 'aa000000-0000-0000-0000-000000000001'
      and dismissed_at is not null
  $$,
  $$
    values (
      '6a000000-0000-0000-0000-000000000001'::uuid,
      '8a000000-0000-0000-0000-000000000001'::uuid,
      '9a000000-0000-0000-0000-000000000001'::uuid
    )
  $$,
  'el registro persiste fisicamente y conserva sus referencias'
);

select results_eq(
  $$
    select
      (select count(*) from public.reservations where id = '6a000000-0000-0000-0000-000000000001'),
      (select count(*) from public.payments where id = '8a000000-0000-0000-0000-000000000001'),
      (select count(*) from public.barbershop_invitations where id = '9a000000-0000-0000-0000-000000000001')
  $$,
  $$ values (1::bigint, 1::bigint, 1::bigint) $$,
  'descartar no altera la reserva el pago ni la invitacion relacionados'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"1a000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select public.dismiss_notification(
      'aa000000-0000-0000-0000-000000000002'
    )
  $$,
  $$ values (false) $$,
  'otro usuario no puede descartar una notificacion ajena'
);

reset role;

select is(
  (
    select dismissed_at
    from public.notifications
    where id = 'aa000000-0000-0000-0000-000000000002'
  ),
  null::timestamptz,
  'el intento ajeno no cambia el estado de descarte'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"1a000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select id
    from public.notifications
    where id = 'aa000000-0000-0000-0000-000000000002'
  $$,
  'otro usuario no puede leer una notificacion ajena no descartada'
);

select throws_ok(
  $$
    update public.notifications
    set message = 'Contenido alterado'
    where id = 'aa000000-0000-0000-0000-000000000003'
  $$,
  '42501',
  null::text,
  'el propietario no puede modificar el contenido protegido'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"sub":"1a000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select reservation_id
    from public.notifications
    where id = 'aa000000-0000-0000-0000-000000000002'
  $$,
  $$ values ('6a000000-0000-0000-0000-000000000001'::uuid) $$,
  'una notificacion no descartada conserva su contexto de navegacion'
);

reset role;
select set_config('request.jwt.claims', '{}', true);

select * from finish();

rollback;

begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

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
    'contact.client.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cliente Operativo A"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'contact.client.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cliente Operativo B"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'contact.outsider@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cliente Sin Reserva"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'contact.admin.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Contacto A"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'contact.barber.a1@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barbero Contacto A1"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'contact.barber.a2@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barbero Contacto A2"}',
    now(),
    now()
  ),
  (
    '12000000-0000-0000-0000-000000000007',
    'authenticated',
    'authenticated',
    'contact.admin.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Contacto B"}',
    now(),
    now()
  );

update public.profiles
set phone = '987654321'
where id = '12000000-0000-0000-0000-000000000001';

insert into public.barbershops (id, created_by, name, status)
values
  (
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000004',
    'Barberia Contacto A',
    'published'
  ),
  (
    '22000000-0000-0000-0000-000000000002',
    '12000000-0000-0000-0000-000000000007',
    'Barberia Contacto B',
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
    '32000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000004',
    'administrator',
    'active'
  ),
  (
    '32000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000005',
    'barber',
    'active'
  ),
  (
    '32000000-0000-0000-0000-000000000003',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000006',
    'barber',
    'active'
  ),
  (
    '32000000-0000-0000-0000-000000000004',
    '22000000-0000-0000-0000-000000000002',
    '12000000-0000-0000-0000-000000000007',
    'administrator',
    'active'
  );

insert into public.barbers (id, barbershop_id, user_id, display_name, is_active)
values
  (
    '42000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000005',
    'Barbero Contacto A1',
    true
  ),
  (
    '42000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000006',
    'Barbero Contacto A2',
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
values
  (
    '62000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000001',
    '42000000-0000-0000-0000-000000000001',
    now() + interval '2 days',
    now() + interval '2 days 30 minutes',
    now() + interval '2 days 45 minutes',
    'confirmed',
    30,
    30,
    15
  ),
  (
    '62000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    '12000000-0000-0000-0000-000000000002',
    '42000000-0000-0000-0000-000000000002',
    now() + interval '3 days',
    now() + interval '3 days 30 minutes',
    now() + interval '3 days 45 minutes',
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
values
  (
    '82000000-0000-0000-0000-000000000001',
    '62000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    'yape',
    'pending',
    30
  ),
  (
    '82000000-0000-0000-0000-000000000002',
    '62000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000001',
    'yape',
    'pending',
    30
  );

insert into public.barbershop_payment_settings (
  barbershop_id,
  yape_qr_url,
  yape_holder_name,
  yape_phone
)
values (
  '22000000-0000-0000-0000-000000000001',
  'https://example.com/yape-contact-a.png',
  'Titular Yape A',
  '999888777'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select full_name, phone
    from public.get_reservation_client_contact(
      '62000000-0000-0000-0000-000000000001'
    )
  $$,
  $$ values ('Cliente Operativo A'::text, '987654321'::text) $$,
  'el barbero asignado obtiene solo el nombre y telefono del cliente'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000006","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select *
    from public.get_reservation_client_contact(
      '62000000-0000-0000-0000-000000000001'
    )
  $$,
  'otro barbero no obtiene el contacto de una reserva no asignada'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select full_name, phone
    from public.get_reservation_client_contact(
      '62000000-0000-0000-0000-000000000001'
    )
  $$,
  $$ values ('Cliente Operativo A'::text, '987654321'::text) $$,
  'el administrador obtiene el contacto de una reserva de su barberia'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000007","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select *
    from public.get_reservation_client_contact(
      '62000000-0000-0000-0000-000000000001'
    )
  $$,
  'un administrador de otra barberia no obtiene el contacto'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select *
    from public.get_reservation_client_contact(
      '62000000-0000-0000-0000-000000000002'
    )
  $$,
  'un identificador de reserva ajena no filtra informacion del cliente'
);

reset role;

update public.barbershops
set status = 'unpublished'
where id = '22000000-0000-0000-0000-000000000001';

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select yape_holder_name, yape_phone, yape_qr_url
    from public.get_reservation_yape_settings(
      '62000000-0000-0000-0000-000000000001'
    )
  $$,
  $$
    values (
      'Titular Yape A'::text,
      '999888777'::text,
      'https://example.com/yape-contact-a.png'::text
    )
  $$,
  'el cliente conserva las instrucciones Yape tras despublicar la barberia'
);

select is_empty(
  $$
    select barbershop_id
    from public.barbershop_payment_settings
    where barbershop_id = '22000000-0000-0000-0000-000000000001'
  $$,
  'la RPC no abre SELECT directo sobre configuracion Yape despublicada'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select *
    from public.get_reservation_yape_settings(
      '62000000-0000-0000-0000-000000000001'
    )
  $$,
  'un cliente sin reserva en la barberia no obtiene configuracion Yape'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select *
    from public.get_reservation_yape_settings(
      '62000000-0000-0000-0000-000000000001'
    )
  $$,
  'el cliente de otra reserva no obtiene configuracion Yape ajena'
);

reset role;

select ok(
  not has_function_privilege(
    'anon',
    'public.get_reservation_client_contact(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.get_reservation_yape_settings(uuid)',
    'execute'
  )
  and not has_table_privilege(
    'anon',
    'public.barbershop_payment_settings',
    'select'
  )
  and not has_column_privilege(
    'authenticated',
    'public.barbershop_payment_settings',
    'created_at',
    'select'
  ),
  'la configuracion Yape completa no queda expuesta publicamente'
);

select * from finish();

rollback;

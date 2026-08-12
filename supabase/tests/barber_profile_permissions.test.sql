begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

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
    '11000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin.profile.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Profile A"}',
    now(),
    now()
  ),
  (
    '11000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'barber.profile.a1@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barber Profile A1"}',
    now(),
    now()
  ),
  (
    '11000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'barber.profile.a2@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barber Profile A2"}',
    now(),
    now()
  ),
  (
    '11000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'admin.profile.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Profile B"}',
    now(),
    now()
  ),
  (
    '11000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'barber.profile.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Barber Profile B"}',
    now(),
    now()
  ),
  (
    '11000000-0000-0000-0000-000000000006',
    'authenticated',
    'authenticated',
    'without.profile@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Without Profile"}',
    now(),
    now()
  );

insert into public.barbershops (id, created_by, name, status)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    'Barberia Profile A',
    'published'
  ),
  (
    '21000000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000004',
    'Barberia Profile B',
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
    '31000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    'administrator',
    'active'
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000002',
    'barber',
    'active'
  ),
  (
    '31000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000003',
    'barber',
    'active'
  ),
  (
    '31000000-0000-0000-0000-000000000004',
    '21000000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000004',
    'administrator',
    'active'
  ),
  (
    '31000000-0000-0000-0000-000000000005',
    '21000000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000005',
    'barber',
    'inactive'
  );

insert into public.barbers (
  id,
  barbershop_id,
  user_id,
  display_name,
  bio,
  photo_url,
  is_active
)
values
  (
    '41000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000002',
    'Barber Profile A1',
    null,
    null,
    true
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000003',
    'Barber Profile A2',
    null,
    null,
    true
  ),
  (
    '41000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000005',
    'Barber Profile B',
    null,
    null,
    false
  );

select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$
    update public.barbers
    set
      display_name = 'Barber A1 Updated',
      bio = 'Perfil publico actualizado',
      photo_url = 'https://example.com/barber-a1.jpg'
    where id = '41000000-0000-0000-0000-000000000001'
  $$,
  'el barbero activo puede editar las columnas publicas de su perfil'
);

select results_eq(
  $$
    select display_name, bio, photo_url
    from public.barbers
    where id = '41000000-0000-0000-0000-000000000001'
  $$,
  $$
    values (
      'Barber A1 Updated'::text,
      'Perfil publico actualizado'::text,
      'https://example.com/barber-a1.jpg'::text
    )
  $$,
  'la edicion propia persiste solo los datos publicos esperados'
);

select throws_ok(
  $$
    update public.barbers
    set user_id = '11000000-0000-0000-0000-000000000003'
    where id = '41000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null::text,
  'el propietario no puede cambiar user_id'
);

select throws_ok(
  $$
    update public.barbers
    set barbershop_id = '21000000-0000-0000-0000-000000000002'
    where id = '41000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null::text,
  'el propietario no puede cambiar barbershop_id'
);

select throws_ok(
  $$
    update public.barbers
    set is_active = false
    where id = '41000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null::text,
  'el propietario no puede cambiar is_active directamente'
);

select is_empty(
  $$
    update public.barbers
    set display_name = 'Cross Barber Update'
    where id = '41000000-0000-0000-0000-000000000002'
    returning id
  $$,
  'un barbero no puede editar el perfil de otro barbero'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  $$
    update public.barbers
    set display_name = 'Barber A2 By Admin'
    where id = '41000000-0000-0000-0000-000000000002'
  $$,
  'el administrador puede editar un perfil de su barberia'
);

select is(
  (
    select display_name
    from public.barbers
    where id = '41000000-0000-0000-0000-000000000002'
  ),
  'Barber A2 By Admin'::text,
  'la edicion del administrador persiste en su barberia'
);

select is_empty(
  $$
    update public.barbers
    set display_name = 'Cross Tenant Admin Update'
    where id = '41000000-0000-0000-0000-000000000003'
    returning id
  $$,
  'el administrador no puede editar perfiles de otra barberia'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select barber_id, is_active
    from public.get_own_barber_profile(
      '21000000-0000-0000-0000-000000000001'
    )
  $$,
  $$ values ('41000000-0000-0000-0000-000000000001'::uuid, true) $$,
  'la RPC devuelve el perfil activo propio'
);

select is_empty(
  $$
    select barber_id, is_active
    from public.get_own_barber_profile(
      '21000000-0000-0000-0000-000000000002'
    )
  $$,
  'cambiar barbershop_id no permite consultar perfiles ajenos'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
set local role authenticated;

select results_eq(
  $$
    select barber_id, is_active
    from public.get_own_barber_profile(
      '21000000-0000-0000-0000-000000000002'
    )
  $$,
  $$ values ('41000000-0000-0000-0000-000000000003'::uuid, false) $$,
  'la RPC devuelve el perfil inactivo propio'
);

select is_empty(
  $$
    select barber_id, is_active
    from public.get_own_barber_profile(
      '21000000-0000-0000-0000-000000000001'
    )
  $$,
  'la RPC no devuelve perfiles de otras barberias'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-0000-0000-000000000006","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select barber_id, is_active
    from public.get_own_barber_profile(
      '21000000-0000-0000-0000-000000000001'
    )
  $$,
  'la RPC devuelve ausencia cuando el usuario no tiene perfil'
);

reset role;

select ok(
  not has_column_privilege('authenticated', 'public.barbers', 'user_id', 'select'),
  'authenticated continua sin SELECT sobre barbers.user_id'
);

select ok(
  has_column_privilege('authenticated', 'public.barbers', 'display_name', 'update')
  and has_column_privilege('authenticated', 'public.barbers', 'bio', 'update')
  and has_column_privilege('authenticated', 'public.barbers', 'photo_url', 'update'),
  'authenticated solo recibe UPDATE para los datos publicos autorizados'
);

select ok(
  not has_column_privilege('authenticated', 'public.barbers', 'id', 'update')
  and not has_column_privilege('authenticated', 'public.barbers', 'barbershop_id', 'update')
  and not has_column_privilege('authenticated', 'public.barbers', 'user_id', 'update')
  and not has_column_privilege('authenticated', 'public.barbers', 'is_active', 'update')
  and not has_column_privilege('authenticated', 'public.barbers', 'created_at', 'update')
  and not has_column_privilege('authenticated', 'public.barbers', 'updated_at', 'update'),
  'authenticated no recibe UPDATE para identidad, estado ni auditoria'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.get_own_barber_profile(uuid)',
    'execute'
  ),
  'authenticated puede ejecutar la RPC estrecha'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.get_own_barber_profile(uuid)',
    'execute'
  ),
  'anon no puede ejecutar la RPC estrecha'
);

select set_config('request.jwt.claims', '{}', true);

select throws_ok(
  $$
    select *
    from public.get_own_barber_profile(
      '21000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null::text,
  'la RPC rechaza una llamada sin usuario autenticado'
);

select * from finish();

rollback;

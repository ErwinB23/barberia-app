begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

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
    'promotion.admin.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Promotion Admin A"}',
    now(),
    now()
  ),
  (
    '18000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'promotion.barber.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Promotion Barber A"}',
    now(),
    now()
  ),
  (
    '18000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'promotion.admin.target@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Promotion Admin Target"}',
    now(),
    now()
  ),
  (
    '18000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'promotion.admin.b@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Promotion Admin B"}',
    now(),
    now()
  ),
  (
    '18000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'promotion.expired@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Promotion Expired"}',
    now(),
    now()
  );

insert into public.barbershops (id, created_by, name, status)
values
  (
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000001',
    'Promotion Barbershop A',
    'unpublished'
  ),
  (
    '28000000-0000-0000-0000-000000000002',
    '18000000-0000-0000-0000-000000000004',
    'Promotion Barbershop B',
    'unpublished'
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
  ),
  (
    '38000000-0000-0000-0000-000000000003',
    '28000000-0000-0000-0000-000000000001',
    '18000000-0000-0000-0000-000000000003',
    'administrator',
    'active'
  ),
  (
    '38000000-0000-0000-0000-000000000004',
    '28000000-0000-0000-0000-000000000002',
    '18000000-0000-0000-0000-000000000004',
    'administrator',
    'active'
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
values (
  '48000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  '18000000-0000-0000-0000-000000000002',
  'Barbero promovible',
  'Perfil que debe conservarse',
  'https://example.com/barber.jpg',
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
  '58000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  'Servicio promoción',
  25,
  30,
  true
);

insert into public.barber_services (
  id,
  barbershop_id,
  barber_id,
  service_id
)
values (
  '68000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  '48000000-0000-0000-0000-000000000001',
  '58000000-0000-0000-0000-000000000001'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

insert into public.barbershop_hours (
  id,
  barbershop_id,
  weekday,
  start_time,
  end_time
)
values (
  '78000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  1,
  '09:00',
  '18:00'
);

insert into public.barber_schedules (
  id,
  barbershop_id,
  barber_id,
  weekday,
  start_time,
  end_time
)
values (
  '88000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  '48000000-0000-0000-0000-000000000001',
  1,
  '10:00',
  '17:00'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

insert into public.barber_blocks (
  id,
  barbershop_id,
  barber_id,
  starts_at,
  ends_at,
  reason,
  created_by
)
values (
  '98000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  '48000000-0000-0000-0000-000000000001',
  now() + interval '20 days',
  now() + interval '20 days 1 hour',
  'Bloqueo que debe conservarse',
  '18000000-0000-0000-0000-000000000002'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select public.send_barbershop_invitation(
  '28000000-0000-0000-0000-000000000001',
  'promotion.barber.a@test.local',
  'administrator',
  'app'
) as promotion_invitation_id \gset

reset role;

select isnt(
  :'promotion_invitation_id'::uuid,
  null::uuid,
  'un administrador puede invitar a promover un barbero activo de su barberia'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  format(
    'select public.accept_barbershop_invitation(%L::uuid)',
    :'promotion_invitation_id'
  ),
  'P0002',
  null::text,
  'un usuario de otra barberia no puede aceptar la invitacion ajena'
);

reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  format(
    'select public.accept_barbershop_invitation(%L::uuid)',
    :'promotion_invitation_id'
  ),
  'el barbero activo puede aceptar la promocion a administrador'
);

reset role;

select results_eq(
  $$
    select role::text, status::text
    from public.barbershop_memberships
    where id = '38000000-0000-0000-0000-000000000002'
  $$,
  $$ values ('administrator'::text, 'active'::text) $$,
  'la misma membership queda activa con rol administrador'
);

select results_eq(
  $$
    select display_name, bio, photo_url, is_active
    from public.barbers
    where id = '48000000-0000-0000-0000-000000000001'
  $$,
  $$
    values (
      'Barbero promovible'::text,
      'Perfil que debe conservarse'::text,
      'https://example.com/barber.jpg'::text,
      true
    )
  $$,
  'el perfil profesional permanece intacto y activo'
);

select is(
  (
    select count(*)
    from public.barber_services
    where id = '68000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'las asignaciones de servicios se conservan'
);

select is(
  (
    select count(*)
    from public.barber_schedules
    where id = '88000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'el horario individual se conserva'
);

select is(
  (
    select count(*)
    from public.barber_blocks
    where id = '98000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'los bloqueos del barbero se conservan'
);

select results_eq(
  format(
    $$
      select status::text, accepted_by
      from public.barbershop_invitations
      where id = %L::uuid
    $$,
    :'promotion_invitation_id'
  ),
  $$
    values (
      'accepted'::text,
      '18000000-0000-0000-0000-000000000002'::uuid
    )
  $$,
  'la invitacion queda aceptada por su destinatario correcto'
);

select is(
  (
    select count(*)
    from public.notifications
    where invitation_id = :'promotion_invitation_id'::uuid
      and user_id = '18000000-0000-0000-0000-000000000001'
      and type = 'invitation_accepted'
  ),
  1::bigint,
  'la promocion notifica una vez a invited_by'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  format(
    'select public.accept_barbershop_invitation(%L::uuid)',
    :'promotion_invitation_id'
  ),
  '22023',
  null::text,
  'la misma invitacion no puede aceptarse dos veces'
);

reset role;

select is(
  (
    select count(*)
    from public.notifications
    where invitation_id = :'promotion_invitation_id'::uuid
      and type = 'invitation_accepted'
  ),
  1::bigint,
  'reintentar la aceptacion no duplica la notificacion'
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
  'a8000000-0000-0000-0000-000000000001',
  '28000000-0000-0000-0000-000000000001',
  '18000000-0000-0000-0000-000000000001',
  'barber',
  'app',
  '18000000-0000-0000-0000-000000000003',
  'promotion.admin.target@test.local',
  'pending',
  now() + interval '7 days'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.accept_barbershop_invitation(
      'a8000000-0000-0000-0000-000000000001'
    )
  $$,
  '23505',
  null::text,
  'un administrador activo no puede aceptar una degradacion a barbero'
);

reset role;

select results_eq(
  $$
    select role::text, status::text
    from public.barbershop_memberships
    where id = '38000000-0000-0000-0000-000000000003'
  $$,
  $$ values ('administrator'::text, 'active'::text) $$,
  'la degradacion rechazada no altera la membership del administrador'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select throws_ok(
  $$
    select public.send_barbershop_invitation(
      '28000000-0000-0000-0000-000000000001',
      'promotion.admin.target@test.local',
      'barber',
      'app'
    )
  $$,
  '23505',
  null::text,
  'no se puede enviar una invitacion que degrade a un administrador activo'
);

select throws_ok(
  $$
    select public.send_barbershop_invitation(
      '28000000-0000-0000-0000-000000000001',
      'promotion.admin.target@test.local',
      'administrator',
      'app'
    )
  $$,
  '23505',
  null::text,
  'no se envia una invitacion redundante a un administrador activo'
);

select public.send_barbershop_invitation(
  '28000000-0000-0000-0000-000000000001',
  'promotion.expired@test.local',
  'administrator',
  'app'
) as expired_invitation_id \gset

reset role;

update public.barbershop_invitations
set expires_at = now() - interval '1 minute'
where id = :'expired_invitation_id'::uuid;

select set_config(
  'request.jwt.claims',
  '{"sub":"18000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  public.accept_barbershop_invitation(:'expired_invitation_id'::uuid),
  null::uuid,
  'una invitacion expirada no se acepta'
);

reset role;

select results_eq(
  format(
    $$
      select invitation.status::text, count(membership.id)
      from public.barbershop_invitations as invitation
      left join public.barbershop_memberships as membership
        on membership.barbershop_id = invitation.barbershop_id
       and membership.user_id = '18000000-0000-0000-0000-000000000005'
      where invitation.id = %L::uuid
      group by invitation.status
    $$,
    :'expired_invitation_id'
  ),
  $$ values ('expired'::text, 0::bigint) $$,
  'la invitacion expirada no crea membresia'
);

select set_config('request.jwt.claims', '{}', true);

select * from finish();

rollback;

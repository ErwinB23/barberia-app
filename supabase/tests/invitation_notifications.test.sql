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
    '17000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'invitations.admin.a@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Invitations Admin A"}',
    now(),
    now()
  ),
  (
    '17000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'invitations.accept@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Invitations Accept"}',
    now(),
    now()
  ),
  (
    '17000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'invitations.reject@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Invitations Reject"}',
    now(),
    now()
  ),
  (
    '17000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'invitations.cancel@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Invitations Cancel"}',
    now(),
    now()
  ),
  (
    '17000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'invitations.unrelated@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Invitations Unrelated"}',
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
  '27000000-0000-0000-0000-000000000001',
  '17000000-0000-0000-0000-000000000001',
  'Invitations Barbershop A',
  'unpublished'
);

insert into public.barbershop_memberships (
  id,
  barbershop_id,
  user_id,
  role,
  status
)
values (
  '37000000-0000-0000-0000-000000000001',
  '27000000-0000-0000-0000-000000000001',
  '17000000-0000-0000-0000-000000000001',
  'administrator',
  'active'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select public.send_barbershop_invitation(
  '27000000-0000-0000-0000-000000000001',
  'invitations.accept@test.local',
  'barber',
  'app'
) as accept_invitation_id \gset

select public.send_barbershop_invitation(
  '27000000-0000-0000-0000-000000000001',
  'invitations.reject@test.local',
  'barber',
  'app'
) as reject_invitation_id \gset

select public.send_barbershop_invitation(
  '27000000-0000-0000-0000-000000000001',
  'invitations.cancel@test.local',
  'barber',
  'app'
) as cancel_invitation_id \gset

select public.send_barbershop_invitation(
  '27000000-0000-0000-0000-000000000001',
  'not-registered@test.local',
  'barber',
  'email'
) as unresolved_invitation_id \gset

reset role;

insert into public.barbershop_invitations (
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
  '27000000-0000-0000-0000-000000000001',
  '17000000-0000-0000-0000-000000000001',
  'barber',
  'app',
  '17000000-0000-0000-0000-000000000001',
  'invitations.admin.a@test.local',
  'pending',
  now() + interval '7 days'
)
returning id as self_invitation_id \gset

select private.create_invitation_notification(
  '17000000-0000-0000-0000-000000000001',
  '27000000-0000-0000-0000-000000000001',
  :'self_invitation_id'::uuid,
  'invitation_received',
  'Invitacion de prueba',
  'Mensaje de prueba.'
);

select results_eq(
  format(
    $$
      select user_id, type
      from public.notifications
      where invitation_id = %L::uuid
    $$,
    :'accept_invitation_id'
  ),
  $$
    values (
      '17000000-0000-0000-0000-000000000002'::uuid,
      'invitation_received'::text
    )
  $$,
  'el envio notifica exactamente al destinatario resoluble'
);

select is(
  (
    select count(*)
    from public.notifications
    where invitation_id = :'unresolved_invitation_id'::uuid
  ),
  0::bigint,
  'una invitacion email sin cuenta no crea notificacion interna'
);

select is(
  (
    select count(*)
    from public.notifications
    where invitation_id = :'self_invitation_id'::uuid
  ),
  0::bigint,
  'el envio no notifica al mismo actor'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"17000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  format(
    'select public.accept_barbershop_invitation(%L::uuid)',
    :'accept_invitation_id'
  ),
  'el destinatario puede aceptar la invitacion'
);

reset role;

select results_eq(
  format(
    $$
      select user_id, type
      from public.notifications
      where invitation_id = %L::uuid
        and type = 'invitation_accepted'
    $$,
    :'accept_invitation_id'
  ),
  $$
    values (
      '17000000-0000-0000-0000-000000000001'::uuid,
      'invitation_accepted'::text
    )
  $$,
  'la aceptacion notifica unicamente a invited_by'
);

select is(
  (
    select count(*)
    from public.notifications
    where invitation_id = :'accept_invitation_id'::uuid
      and type = 'invitation_accepted'
      and user_id = '17000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'la aceptacion no notifica al actor'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"17000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  format(
    'select public.reject_barbershop_invitation(%L::uuid)',
    :'reject_invitation_id'
  ),
  'el destinatario puede rechazar la invitacion'
);

reset role;

select results_eq(
  format(
    $$
      select user_id, type
      from public.notifications
      where invitation_id = %L::uuid
        and type = 'invitation_rejected'
    $$,
    :'reject_invitation_id'
  ),
  $$
    values (
      '17000000-0000-0000-0000-000000000001'::uuid,
      'invitation_rejected'::text
    )
  $$,
  'el rechazo notifica unicamente a invited_by'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;

select lives_ok(
  format(
    'select public.cancel_barbershop_invitation(%L::uuid)',
    :'cancel_invitation_id'
  ),
  'el administrador puede cancelar la invitacion'
);

reset role;

select results_eq(
  format(
    $$
      select user_id, type
      from public.notifications
      where invitation_id = %L::uuid
        and type = 'invitation_cancelled'
    $$,
    :'cancel_invitation_id'
  ),
  $$
    values (
      '17000000-0000-0000-0000-000000000004'::uuid,
      'invitation_cancelled'::text
    )
  $$,
  'la cancelacion notifica unicamente al destinatario resoluble'
);

select is(
  (
    select count(*)
    from public.notifications
    where invitation_id = :'cancel_invitation_id'::uuid
      and type = 'invitation_cancelled'
      and user_id = '17000000-0000-0000-0000-000000000001'
  ),
  0::bigint,
  'la cancelacion no notifica al actor'
);

select throws_ok(
  format(
    $$
      insert into private.invitation_notification_deliveries (
        user_id,
        invitation_id,
        type
      )
      values (
        '17000000-0000-0000-0000-000000000001',
        %L::uuid,
        'invitation_accepted'
      )
    $$,
    :'accept_invitation_id'
  ),
  '23505',
  null::text,
  'el registro privado impide duplicar el mismo evento de invitacion'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"17000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);
set local role authenticated;

select is_empty(
  $$
    select id
    from public.notifications
  $$,
  'un usuario ajeno no puede leer notificaciones de invitaciones'
);

select throws_ok(
  $$
    insert into public.notifications (
      user_id,
      type,
      title,
      message
    )
    values (
      '17000000-0000-0000-0000-000000000005',
      'invitation_received',
      'No permitido',
      'El cliente no puede insertar notificaciones.'
    )
  $$,
  '42501',
  null::text,
  'authenticated no tiene INSERT directo sobre notifications'
);

reset role;
select set_config('request.jwt.claims', '{}', true);

select * from finish();

rollback;

create table private.invitation_notification_deliveries (
  user_id uuid not null
    references public.profiles(id) on delete cascade,

  invitation_id uuid not null
    references public.barbershop_invitations(id) on delete cascade,

  type text not null,
  created_at timestamptz not null default now(),

  constraint invitation_notification_deliveries_pkey
    primary key (user_id, invitation_id, type),

  constraint invitation_notification_deliveries_type_check
    check (
      type in (
        'invitation_received',
        'invitation_accepted',
        'invitation_rejected',
        'invitation_cancelled'
      )
    )
);


revoke all
on table private.invitation_notification_deliveries
from public, anon, authenticated;


-- Preserve the identity of invitation notifications that may already exist.
insert into private.invitation_notification_deliveries (
  user_id,
  invitation_id,
  type
)
select distinct
  notification.user_id,
  notification.invitation_id,
  notification.type
from public.notifications as notification
where notification.invitation_id is not null
  and notification.type in (
    'invitation_received',
    'invitation_accepted',
    'invitation_rejected',
    'invitation_cancelled'
  )
on conflict do nothing;


create or replace function private.create_invitation_notification(
  p_user_id uuid,
  p_barbershop_id uuid,
  p_invitation_id uuid,
  p_type text,
  p_title text,
  p_message text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
     or p_user_id = (select auth.uid()) then
    return;
  end if;

  insert into private.invitation_notification_deliveries (
    user_id,
    invitation_id,
    type
  )
  values (
    p_user_id,
    p_invitation_id,
    p_type
  )
  on conflict do nothing;

  if not found then
    return;
  end if;

  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    invitation_id
  )
  values (
    p_user_id,
    p_barbershop_id,
    p_type,
    p_title,
    p_message,
    p_invitation_id
  );
end;
$$;


revoke execute
on function private.create_invitation_notification(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text
)
from public, anon, authenticated;


create or replace function private.notify_invitation_status_change()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  case new.status
    when 'accepted' then
      perform private.create_invitation_notification(
        new.invited_by,
        new.barbershop_id,
        new.id,
        'invitation_accepted',
        'Invitación aceptada',
        'La persona invitada aceptó unirse a tu barbería.'
      );

    when 'rejected' then
      perform private.create_invitation_notification(
        new.invited_by,
        new.barbershop_id,
        new.id,
        'invitation_rejected',
        'Invitación rechazada',
        'La persona invitada rechazó la invitación.'
      );

    when 'cancelled' then
      perform private.create_invitation_notification(
        new.recipient_user_id,
        new.barbershop_id,
        new.id,
        'invitation_cancelled',
        'Invitación cancelada',
        'La invitación para unirte a la barbería fue cancelada.'
      );

    else
      null;
  end case;

  return new;
end;
$$;


revoke execute
on function private.notify_invitation_status_change()
from public, anon, authenticated;


create trigger barbershop_invitations_notify_status_change
after update of status
on public.barbershop_invitations
for each row
when (old.status is distinct from new.status)
execute function private.notify_invitation_status_change();


create or replace function private.send_barbershop_invitation_impl(
  p_barbershop_id uuid,
  p_email text,
  p_role public.membership_role,
  p_channel public.invitation_channel
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_inviter_id uuid;
  v_recipient_user_id uuid;
  v_invitation_id uuid;
  v_email text;
begin
  v_inviter_id := (select auth.uid());
  v_email := lower(trim(p_email));

  if v_inviter_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  if v_email is null
     or char_length(v_email) < 5
     or char_length(v_email) > 320 then
    raise exception 'Invalid email'
      using errcode = '22023';
  end if;

  select auth_user.id
  into v_recipient_user_id
  from auth.users as auth_user
  where lower(trim(auth_user.email)) = v_email
  limit 1;

  update public.barbershop_invitations
  set
    status = 'expired',
    responded_at = now()
  where barbershop_id = p_barbershop_id
    and role = p_role
    and status = 'pending'
    and expires_at <= now()
    and lower(trim(email)) = v_email;

  if exists (
    select 1
    from public.barbershop_invitations as invitation
    where invitation.barbershop_id = p_barbershop_id
      and invitation.status = 'pending'
      and invitation.role = p_role
      and lower(trim(invitation.email)) = v_email
  ) then
    raise exception 'A pending invitation already exists'
      using errcode = '23505';
  end if;

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
    p_barbershop_id,
    v_inviter_id,
    p_role,
    p_channel,
    v_recipient_user_id,
    v_email,
    'pending',
    now() + interval '7 days'
  )
  returning id into v_invitation_id;

  perform private.create_invitation_notification(
    v_recipient_user_id,
    p_barbershop_id,
    v_invitation_id,
    'invitation_received',
    'Nueva invitación',
    'Has recibido una invitación para unirte a una barbería.'
  );

  return v_invitation_id;
end;
$$;


revoke execute
on function private.send_barbershop_invitation_impl(
  uuid,
  text,
  public.membership_role,
  public.invitation_channel
)
from public, anon, authenticated;

-- Allow an active barber to accept an administrator invitation for the same
-- barbershop without replacing the membership or operational barber profile.

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
  v_recipient_role public.membership_role;
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

  if v_recipient_user_id is not null then
    select membership.role
    into v_recipient_role
    from public.barbershop_memberships as membership
    where membership.barbershop_id = p_barbershop_id
      and membership.user_id = v_recipient_user_id
      and membership.status = 'active'
    for update;

    if found
       and not (
         v_recipient_role = 'barber'
         and p_role = 'administrator'
       ) then
      raise exception 'User already has an equal or higher active role'
        using errcode = '23505';
    end if;
  end if;

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


create or replace function private.accept_barbershop_invitation_impl(
  p_invitation_id uuid,
  p_display_name text,
  p_bio text,
  p_photo_url text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_invitation public.barbershop_invitations%rowtype;
  v_display_name text;
  v_membership_id uuid;
  v_existing_membership_id uuid;
  v_existing_role public.membership_role;
  v_existing_status public.membership_status;
  v_is_active_promotion boolean := false;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select lower(trim(auth_user.email))
  into v_user_email
  from auth.users as auth_user
  where auth_user.id = v_user_id;

  select *
  into v_invitation
  from public.barbershop_invitations
  where id = p_invitation_id
    and (
      recipient_user_id = v_user_id
      or lower(trim(email)) = v_user_email
    )
  for update;

  if not found then
    raise exception 'Invitation not found'
      using errcode = 'P0002';
  end if;

  if v_invitation.status <> 'pending' then
    raise exception 'Invitation is no longer pending'
      using errcode = '22023';
  end if;

  if v_invitation.expires_at <= now() then
    update public.barbershop_invitations
    set
      status = 'expired',
      responded_at = now()
    where id = p_invitation_id;

    return null;
  end if;

  select membership.id, membership.role, membership.status
  into v_existing_membership_id, v_existing_role, v_existing_status
  from public.barbershop_memberships as membership
  where membership.barbershop_id = v_invitation.barbershop_id
    and membership.user_id = v_user_id
  for update;

  if found and v_existing_status = 'active' then
    if v_existing_role = 'barber'
       and v_invitation.role = 'administrator' then
      v_is_active_promotion := true;
    else
      raise exception 'User already has an equal or higher active role'
        using errcode = '23505';
    end if;
  end if;

  if v_is_active_promotion then
    update public.barbershop_memberships
    set role = 'administrator'
    where id = v_existing_membership_id
    returning id into v_membership_id;
  else
    insert into public.barbershop_memberships (
      barbershop_id,
      user_id,
      role,
      status,
      joined_at
    )
    values (
      v_invitation.barbershop_id,
      v_user_id,
      v_invitation.role,
      'active',
      now()
    )
    on conflict (barbershop_id, user_id)
    do update set
      role = case
        when public.barbershop_memberships.role = 'administrator'
          then public.barbershop_memberships.role
        else excluded.role
      end,
      status = 'active',
      joined_at = now()
    returning id into v_membership_id;
  end if;

  if v_invitation.role = 'barber' then
    v_display_name := nullif(trim(p_display_name), '');

    if v_display_name is null then
      select nullif(trim(profile.full_name), '')
      into v_display_name
      from public.profiles as profile
      where profile.id = v_user_id;
    end if;

    if v_display_name is null
       or char_length(v_display_name) < 2
       or char_length(v_display_name) > 120 then
      raise exception 'A valid barber display name is required'
        using errcode = '22023';
    end if;

    insert into public.barbers (
      barbershop_id,
      user_id,
      display_name,
      bio,
      photo_url,
      is_active
    )
    values (
      v_invitation.barbershop_id,
      v_user_id,
      v_display_name,
      nullif(trim(p_bio), ''),
      nullif(trim(p_photo_url), ''),
      true
    )
    on conflict (barbershop_id, user_id)
    do update set
      display_name = excluded.display_name,
      bio = coalesce(excluded.bio, public.barbers.bio),
      photo_url = coalesce(
        excluded.photo_url,
        public.barbers.photo_url
      ),
      is_active = true;
  end if;

  update public.barbershop_invitations
  set
    status = 'accepted',
    recipient_user_id = coalesce(
      recipient_user_id,
      v_user_id
    ),
    accepted_by = v_user_id,
    accepted_at = now(),
    responded_at = now()
  where id = p_invitation_id;

  return v_membership_id;
end;
$$;

revoke execute
on function private.accept_barbershop_invitation_impl(
  uuid,
  text,
  text,
  text
)
from public, anon, authenticated;

alter table public.notifications
  add column dismissed_at timestamptz;

comment on column public.notifications.dismissed_at is
  'Fecha en que el destinatario oculto la notificacion de su centro personal.';

create or replace function public.dismiss_notification(
  p_notification_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication required';
  end if;

  update public.notifications
  set dismissed_at = pg_catalog.clock_timestamp()
  where id = p_notification_id
    and user_id = v_user_id
    and dismissed_at is null;

  return found;
end;
$$;

comment on function public.dismiss_notification(uuid) is
  'Oculta una notificacion unicamente para su destinatario autenticado.';

revoke execute
on function public.dismiss_notification(uuid)
from public, anon;

grant execute
on function public.dismiss_notification(uuid)
to authenticated;

drop policy notifications_select_own
on public.notifications;

create policy notifications_select_own
on public.notifications
for select
to authenticated
using (
  user_id = (select auth.uid())
  and dismissed_at is null
);

drop index public.notifications_user_created_idx;

create index notifications_user_created_idx
  on public.notifications (
    user_id,
    created_at desc
  )
  where dismissed_at is null;

drop index public.notifications_user_unread_idx;

create index notifications_user_unread_idx
  on public.notifications (
    user_id,
    created_at desc
  )
  where is_read = false
    and dismissed_at is null;

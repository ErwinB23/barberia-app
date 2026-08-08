-- =========================================================
-- APP BARBERÍA - ESQUEMA INICIAL V1
-- Tipos del dominio
-- =========================================================

create type public.barbershop_status as enum (
  'unpublished',
  'published',
  'paused'
);

create type public.membership_role as enum (
  'barber',
  'administrator'
);

create type public.membership_status as enum (
  'active',
  'inactive'
);

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'rejected',
  'expired',
  'cancelled'
);

create type public.invitation_channel as enum (
  'email',
  'app'
);

create type public.reservation_status as enum (
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create type public.payment_method as enum (
  'cash',
  'yape'
);

create type public.payment_status as enum (
  'pending',
  'paid',
  'refunded',
  'failed'
);

create type public.late_cancellation_refund_policy as enum (
  'full_refund',
  'no_refund'
);


revoke create on schema public
from public, anon, authenticated;



-- =========================================================
-- IDENTIDAD
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text,
  phone text,
  avatar_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_full_name_length_check
    check (
      full_name is null
      or char_length(trim(full_name)) between 2 and 120
    ),

  constraint profiles_phone_length_check
    check (
      phone is null
      or char_length(trim(phone)) between 7 and 30
    )
);


-- =========================================================
-- BARBERÍAS
-- =========================================================

create table public.barbershops (
  id uuid primary key default gen_random_uuid(),

  created_by uuid references public.profiles(id) on delete set null,

  name text not null,
  logo_url text,
  description text,
  phone text,
  address text,
  location_reference text,

  status public.barbershop_status not null default 'unpublished',

  yape_qr_url text,
  yape_holder_name text,
  yape_phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbershops_name_length_check
    check (char_length(trim(name)) between 2 and 120),

  constraint barbershops_description_length_check
    check (
      description is null
      or char_length(description) <= 500
    ),

  constraint barbershops_phone_length_check
    check (
      phone is null
      or char_length(trim(phone)) between 7 and 30
    ),

  constraint barbershops_address_length_check
    check (
      address is null
      or char_length(trim(address)) <= 250
    ),

  constraint barbershops_location_reference_length_check
    check (
      location_reference is null
      or char_length(trim(location_reference)) <= 250
    )
);


create index barbershops_created_by_idx
  on public.barbershops (created_by)
  where created_by is not null;


-- =========================================================
-- MEMBRESÍAS DE BARBERÍA
-- =========================================================

create table public.barbershop_memberships (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null
    references public.barbershops(id) on delete cascade,

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  role public.membership_role not null,
  status public.membership_status not null default 'active',

  joined_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbershop_memberships_barbershop_user_unique
    unique (barbershop_id, user_id)
);


create index barbershop_memberships_user_idx
  on public.barbershop_memberships (
    user_id,
    status,
    barbershop_id
  );


-- =========================================================
-- BARBEROS
-- =========================================================

create table public.barbers (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null,
  user_id uuid not null,

  display_name text not null,
  bio text,
  photo_url text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbers_membership_fk
    foreign key (barbershop_id, user_id)
    references public.barbershop_memberships (barbershop_id, user_id)
    on delete restrict,

  constraint barbers_barbershop_user_unique
    unique (barbershop_id, user_id),

  constraint barbers_display_name_length_check
    check (char_length(trim(display_name)) between 2 and 120),

  constraint barbers_bio_length_check
    check (
      bio is null
      or char_length(bio) <= 500
    )
);


create index barbers_user_idx
  on public.barbers (user_id);


-- =========================================================
-- INVITACIONES A BARBERÍAS
-- =========================================================

create table public.barbershop_invitations (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null
    references public.barbershops(id) on delete cascade,

  invited_by uuid not null
    references public.profiles(id) on delete restrict,

  role public.membership_role not null,
  channel public.invitation_channel not null,

  -- Para invitaciones directas dentro de la aplicación
  recipient_user_id uuid
    references public.profiles(id) on delete cascade,

  -- Identificador normalizado del destinatario en todos los canales.
  email text not null,

  status public.invitation_status not null default 'pending',

  expires_at timestamptz not null
    default (now() + interval '7 days'),

  accepted_by uuid
    references public.profiles(id) on delete set null,

  accepted_at timestamptz,
  responded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbershop_invitations_recipient_check
    check (
      char_length(trim(email)) between 5 and 320
    ),

  constraint barbershop_invitations_status_data_check
    check (
      (
        status = 'pending'
        and accepted_by is null
        and accepted_at is null
        and responded_at is null
      )
      or
      (
        status = 'accepted'
        and accepted_by is not null
        and accepted_at is not null
        and responded_at is not null
      )
      or
      (
        status in ('rejected', 'expired', 'cancelled')
        and accepted_by is null
        and accepted_at is null
        and responded_at is not null
      )
    )
);

create unique index barbershop_invitations_pending_recipient_unique
  on public.barbershop_invitations (
    barbershop_id,
    lower(trim(email)),
    role
  )
  where status = 'pending';


create index barbershop_invitations_recipient_idx
  on public.barbershop_invitations (
    recipient_user_id,
    status,
    created_at desc
  )
  where recipient_user_id is not null;


create index barbershop_invitations_invited_by_idx
  on public.barbershop_invitations (invited_by);


create index barbershop_invitations_accepted_by_idx
  on public.barbershop_invitations (accepted_by)
  where accepted_by is not null;


-- =========================================================
-- CATÁLOGO DE SERVICIOS
-- =========================================================

create table public.services (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null
    references public.barbershops(id) on delete cascade,

  name text not null,
  description text,

  price numeric(10, 2) not null,
  duration_minutes integer not null,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_id_barbershop_unique
    unique (id, barbershop_id),

  constraint services_name_length_check
    check (char_length(trim(name)) between 2 and 120),

  constraint services_description_length_check
    check (
      description is null
      or char_length(description) <= 500
    ),

  constraint services_price_check
    check (price >= 0),

  constraint services_duration_check
    check (duration_minutes between 1 and 480)
);


create unique index services_barbershop_name_unique
  on public.services (
    barbershop_id,
    lower(trim(name))
  );


-- =========================================================
-- ESTILOS / REFERENCIAS VISUALES
-- =========================================================

create table public.styles (
  id uuid primary key default gen_random_uuid(),

  service_id uuid not null
    references public.services(id) on delete cascade,

  name text not null,
  description text,
  image_url text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint styles_name_length_check
    check (char_length(trim(name)) between 2 and 120),

  constraint styles_description_length_check
    check (
      description is null
      or char_length(description) <= 500
    )
);


create unique index styles_service_name_unique
  on public.styles (
    service_id,
    lower(trim(name))
  );


-- =========================================================
-- SERVICIOS QUE REALIZA CADA BARBERO
-- =========================================================

alter table public.barbers
  add constraint barbers_id_barbershop_unique
  unique (id, barbershop_id);


create table public.barber_services (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null,
  barber_id uuid not null,
  service_id uuid not null,

  created_at timestamptz not null default now(),

  constraint barber_services_barber_fk
    foreign key (barber_id, barbershop_id)
    references public.barbers (id, barbershop_id)
    on delete cascade,

  constraint barber_services_service_fk
    foreign key (service_id, barbershop_id)
    references public.services (id, barbershop_id)
    on delete cascade,

  constraint barber_services_barber_service_unique
    unique (barber_id, service_id)
);


create index barber_services_service_idx
  on public.barber_services (
    service_id,
    barber_id
  );


-- =========================================================
-- HORARIOS GENERALES DE LA BARBERÍA
-- weekday: 0 = domingo, 1 = lunes, ..., 6 = sábado
-- La ausencia de filas para un día significa CERRADO.
-- =========================================================

create table public.barbershop_hours (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null
    references public.barbershops(id) on delete cascade,

  weekday smallint not null,
  start_time time not null,
  end_time time not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbershop_hours_weekday_check
    check (weekday between 0 and 6),

  constraint barbershop_hours_time_check
    check (start_time < end_time),

  constraint barbershop_hours_unique
    unique (
      barbershop_id,
      weekday,
      start_time,
      end_time
    )
);


create index barbershop_hours_lookup_idx
  on public.barbershop_hours (
    barbershop_id,
    weekday
  );


-- =========================================================
-- HORARIO SEMANAL DE CADA BARBERO
-- =========================================================

create table public.barber_schedules (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null,
  barber_id uuid not null,

  weekday smallint not null,
  start_time time not null,
  end_time time not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barber_schedules_barber_fk
    foreign key (barber_id, barbershop_id)
    references public.barbers (id, barbershop_id)
    on delete cascade,

  constraint barber_schedules_weekday_check
    check (weekday between 0 and 6),

  constraint barber_schedules_time_check
    check (start_time < end_time),

  constraint barber_schedules_unique
    unique (
      barber_id,
      weekday,
      start_time,
      end_time
    )
);


create index barber_schedules_lookup_idx
  on public.barber_schedules (
    barber_id,
    weekday
  );


-- =========================================================
-- BLOQUEOS EXCEPCIONALES DE UN BARBERO
-- =========================================================

create table public.barber_blocks (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null,
  barber_id uuid not null,

  starts_at timestamptz not null,
  ends_at timestamptz not null,

  reason text,

  created_by uuid not null
    references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barber_blocks_barber_fk
    foreign key (barber_id, barbershop_id)
    references public.barbers (id, barbershop_id)
    on delete cascade,

  constraint barber_blocks_time_check
    check (starts_at < ends_at),

  constraint barber_blocks_reason_length_check
    check (
      reason is null
      or char_length(reason) <= 250
    )
);


create index barber_blocks_lookup_idx
  on public.barber_blocks (
    barber_id,
    starts_at,
    ends_at
  );


create index barber_blocks_created_by_idx
  on public.barber_blocks (created_by);


-- =========================================================
-- CIERRES EXCEPCIONALES DE TODA LA BARBERÍA
-- =========================================================

create table public.barbershop_closures (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null
    references public.barbershops(id) on delete cascade,

  starts_at timestamptz not null,
  ends_at timestamptz not null,

  reason text,

  created_by uuid not null
    references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbershop_closures_time_check
    check (starts_at < ends_at),

  constraint barbershop_closures_reason_length_check
    check (
      reason is null
      or char_length(reason) <= 250
    )
);


create index barbershop_closures_lookup_idx
  on public.barbershop_closures (
    barbershop_id,
    starts_at,
    ends_at
  );


create index barbershop_closures_created_by_idx
  on public.barbershop_closures (created_by);


-- =========================================================
-- CONFIGURACIÓN Y POLÍTICAS DE CADA BARBERÍA
-- =========================================================

create table public.barbershop_settings (
  barbershop_id uuid primary key
    references public.barbershops(id) on delete cascade,

  -- Tiempo mínimo de anticipación para reservar.
  min_booking_notice_minutes integer not null default 60,

  -- Máximo de días hacia adelante en los que se puede reservar.
  max_booking_days integer not null default 15,

  -- Intervalo utilizado para mostrar horarios disponibles.
  slot_interval_minutes integer not null default 15,

  -- Margen entre una atención y la siguiente.
  appointment_buffer_minutes integer not null default 15,

  -- A partir de cuántos minutos se considera cancelación tardía.
  cancellation_notice_minutes integer not null default 120,

  -- Política de reembolso cuando existe cancelación tardía.
  late_cancellation_refund_policy
    public.late_cancellation_refund_policy
    not null
    default 'full_refund',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbershop_settings_min_booking_notice_check
    check (
      min_booking_notice_minutes between 0 and 1440
    ),

  constraint barbershop_settings_max_booking_days_check
    check (
      max_booking_days between 1 and 365
    ),

  constraint barbershop_settings_slot_interval_check
    check (
      slot_interval_minutes between 5 and 120
    ),

  constraint barbershop_settings_buffer_check
    check (
      appointment_buffer_minutes between 0 and 240
    ),

  constraint barbershop_settings_cancellation_notice_check
    check (
      cancellation_notice_minutes between 0 and 10080
    )
);

-- =========================================================
-- EXTENSIÓN PARA RESTRICCIONES DE SOLAPAMIENTO
-- =========================================================

create extension if not exists btree_gist
  with schema extensions;


-- =========================================================
-- RESERVAS
-- =========================================================

create table public.reservations (
  id uuid primary key default gen_random_uuid(),

  barbershop_id uuid not null
    references public.barbershops(id) on delete restrict,

  client_id uuid not null
    references public.profiles(id) on delete restrict,

  barber_id uuid not null,

  starts_at timestamptz not null,

  -- Fin real de los servicios.
  ends_at timestamptz not null,

  -- Fin real + margen entre citas.
  occupied_until timestamptz not null,

  status public.reservation_status not null
    default 'confirmed',

  -- Totales congelados al momento de reservar.
  total_price numeric(10, 2) not null,
  total_duration_minutes integer not null,
  buffer_minutes_at_booking integer not null,

  -- Máximo una reprogramación.
  reschedule_count smallint not null default 0,
  rescheduled_at timestamptz,

  -- Como solo se permite una reprogramación,
  -- guardamos los datos principales de la cita anterior.
  previous_starts_at timestamptz,
  previous_barber_id uuid,

  cancelled_at timestamptz,
  cancelled_by uuid
    references public.profiles(id) on delete restrict,

  is_late_cancellation boolean not null default false,

  no_show_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reservations_barber_fk
    foreign key (barber_id, barbershop_id)
    references public.barbers (id, barbershop_id)
    on delete restrict,

  constraint reservations_id_barbershop_unique
    unique (id, barbershop_id),

  constraint reservations_time_check
    check (
      starts_at < ends_at
      and ends_at = starts_at
        + make_interval(mins => total_duration_minutes)
      and occupied_until = ends_at
        + make_interval(mins => buffer_minutes_at_booking)
    ),

  constraint reservations_price_check
    check (total_price >= 0),

  constraint reservations_duration_check
    check (total_duration_minutes between 1 and 4800),

  constraint reservations_buffer_check
    check (buffer_minutes_at_booking between 0 and 240),

  constraint reservations_reschedule_count_check
    check (reschedule_count between 0 and 1),

  constraint reservations_reschedule_data_check
    check (
      (
        reschedule_count = 0
        and rescheduled_at is null
        and previous_starts_at is null
        and previous_barber_id is null
      )
      or
      (
        reschedule_count = 1
        and rescheduled_at is not null
        and previous_starts_at is not null
        and previous_barber_id is not null
      )
    )
);


-- =========================================================
-- IMPEDIR RESERVAS ACTIVAS SOLAPADAS PARA EL MISMO BARBERO
-- =========================================================

alter table public.reservations
  add constraint reservations_no_active_overlap
  exclude using gist (
    barber_id with =,
    tstzrange(starts_at, occupied_until, '[)') with &&
  )
  where (
    status in ('confirmed', 'in_progress')
  );


-- Índices para consultas habituales.
create index reservations_client_idx
  on public.reservations (
    client_id,
    starts_at desc
  );


create index reservations_barbershop_idx
  on public.reservations (
    barbershop_id,
    starts_at desc
  );


create index reservations_barber_idx
  on public.reservations (
    barber_id,
    starts_at desc
  );


create index reservations_status_idx
  on public.reservations (
    barbershop_id,
    status,
    starts_at
  );


create index reservations_cancelled_by_idx
  on public.reservations (cancelled_by)
  where cancelled_by is not null;


create index reservations_previous_barber_idx
  on public.reservations (previous_barber_id)
  where previous_barber_id is not null;


-- =========================================================
-- PREPARAR ESTILOS PARA VALIDAR ESTILO + SERVICIO
-- =========================================================

alter table public.styles
  add constraint styles_id_service_unique
  unique (id, service_id);


-- =========================================================
-- SERVICIOS INCLUIDOS EN CADA RESERVA
-- =========================================================

create table public.reservation_services (
  id uuid primary key default gen_random_uuid(),

  reservation_id uuid not null,
  barbershop_id uuid not null,

  service_id uuid not null,
  style_id uuid,

  -- Snapshot histórico.
  price_at_booking numeric(10, 2) not null,
  duration_at_booking integer not null,

  created_at timestamptz not null default now(),

  constraint reservation_services_reservation_fk
    foreign key (reservation_id, barbershop_id)
    references public.reservations (id, barbershop_id)
    on delete cascade,

  constraint reservation_services_service_fk
    foreign key (service_id, barbershop_id)
    references public.services (id, barbershop_id)
    on delete restrict,

  constraint reservation_services_style_fk
    foreign key (style_id, service_id)
    references public.styles (id, service_id)
    on delete restrict,

  constraint reservation_services_unique
    unique (reservation_id, service_id),

  constraint reservation_services_price_check
    check (price_at_booking >= 0),

  constraint reservation_services_duration_check
    check (duration_at_booking between 1 and 480)
);


create index reservation_services_reservation_idx
  on public.reservation_services (reservation_id);


create index reservation_services_service_idx
  on public.reservation_services (service_id);


create index reservation_services_style_idx
  on public.reservation_services (style_id)
  where style_id is not null;



-- =========================================================
-- PAGOS
-- Una reserva tiene como máximo un pago.
-- =========================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  reservation_id uuid not null,
  barbershop_id uuid not null,

  method public.payment_method not null,
  status public.payment_status not null default 'pending',

  -- Importe congelado correspondiente a la reserva.
  amount numeric(10, 2) not null,

  -- Datos opcionales para Yape o anotaciones administrativas.
  yape_reference text,
  payment_note text,

  confirmed_by uuid
    references public.profiles(id) on delete restrict,

  confirmed_at timestamptz,

  refunded_by uuid
    references public.profiles(id) on delete restrict,

  refunded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint payments_reservation_fk
    foreign key (reservation_id, barbershop_id)
    references public.reservations (id, barbershop_id)
    on delete restrict,

  constraint payments_reservation_unique
    unique (reservation_id),

  constraint payments_amount_check
    check (amount >= 0),

  constraint payments_yape_reference_length_check
    check (
      yape_reference is null
      or char_length(trim(yape_reference)) <= 120
    ),

  constraint payments_note_length_check
    check (
      payment_note is null
      or char_length(payment_note) <= 500
    ),

  constraint payments_status_data_check
    check (
      (
        status in ('pending', 'failed')
        and confirmed_by is null
        and confirmed_at is null
        and refunded_by is null
        and refunded_at is null
      )
      or
      (
        status = 'paid'
        and confirmed_by is not null
        and confirmed_at is not null
        and refunded_by is null
        and refunded_at is null
      )
      or
      (
        status = 'refunded'
        and confirmed_by is not null
        and confirmed_at is not null
        and refunded_by is not null
        and refunded_at is not null
      )
    )
);


create index payments_barbershop_idx
  on public.payments (
    barbershop_id,
    status,
    created_at desc
  );


create index payments_confirmed_by_idx
  on public.payments (confirmed_by)
  where confirmed_by is not null;


create index payments_refunded_by_idx
  on public.payments (refunded_by)
  where refunded_by is not null;



-- =========================================================
-- BARBERÍAS FAVORITAS DEL CLIENTE
-- =========================================================

create table public.favorite_barbershops (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  barbershop_id uuid not null
    references public.barbershops(id) on delete cascade,

  is_primary boolean not null default false,

  created_at timestamptz not null default now(),

  constraint favorite_barbershops_user_barbershop_unique
    unique (user_id, barbershop_id)
);


-- Un usuario puede tener muchas favoritas,
-- pero como máximo una barbería principal.
create unique index favorite_barbershops_one_primary_per_user
  on public.favorite_barbershops (user_id)
  where is_primary = true;


create index favorite_barbershops_user_idx
  on public.favorite_barbershops (
    user_id,
    created_at desc
  );


create index favorite_barbershops_barbershop_idx
  on public.favorite_barbershops (barbershop_id);


-- =========================================================
-- PREPARAR RELACIONES COMPUESTAS PARA NOTIFICACIONES
-- =========================================================

alter table public.payments
  add constraint payments_id_barbershop_unique
  unique (id, barbershop_id);


alter table public.barbershop_invitations
  add constraint barbershop_invitations_id_barbershop_unique
  unique (id, barbershop_id);


-- =========================================================
-- NOTIFICACIONES
-- Cada fila representa una notificación para un usuario.
-- =========================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id) on delete cascade,

  -- Puede ser NULL para notificaciones generales de la cuenta.
  barbershop_id uuid
    references public.barbershops(id) on delete cascade,

  -- Se mantiene como TEXT para poder agregar nuevos tipos
  -- en el futuro sin modificar un enum.
  type text not null,

  title text not null,
  message text not null,

  is_read boolean not null default false,
  read_at timestamptz,

  -- Contexto opcional de la notificación.
  reservation_id uuid,
  payment_id uuid,
  invitation_id uuid,

  created_at timestamptz not null default now(),

  constraint notifications_reservation_fk
    foreign key (reservation_id, barbershop_id)
    references public.reservations (id, barbershop_id)
    on delete cascade,

  constraint notifications_payment_fk
    foreign key (payment_id, barbershop_id)
    references public.payments (id, barbershop_id)
    on delete cascade,

  constraint notifications_invitation_fk
    foreign key (invitation_id, barbershop_id)
    references public.barbershop_invitations (id, barbershop_id)
    on delete cascade,

  constraint notifications_type_check
    check (
      char_length(trim(type)) between 2 and 80
      and type ~ '^[a-z][a-z0-9_]*$'
    ),

  constraint notifications_title_length_check
    check (
      char_length(trim(title)) between 1 and 120
    ),

  constraint notifications_message_length_check
    check (
      char_length(trim(message)) between 1 and 500
    ),

  constraint notifications_read_state_check
    check (
      (is_read = false and read_at is null)
      or
      (is_read = true and read_at is not null)
    ),

  constraint notifications_reservation_barbershop_check
    check (
      reservation_id is null
      or barbershop_id is not null
    ),

  constraint notifications_payment_barbershop_check
    check (
      payment_id is null
      or barbershop_id is not null
    ),

  constraint notifications_invitation_barbershop_check
    check (
      invitation_id is null
      or barbershop_id is not null
    )
);


-- Centro de notificaciones del usuario.
create index notifications_user_created_idx
  on public.notifications (
    user_id,
    created_at desc
  );


-- Optimiza contador/listado de notificaciones no leídas.
create index notifications_user_unread_idx
  on public.notifications (
    user_id,
    created_at desc
  )
  where is_read = false;


create index notifications_barbershop_idx
  on public.notifications (
    barbershop_id,
    created_at desc
  )
  where barbershop_id is not null;


create index notifications_reservation_idx
  on public.notifications (reservation_id)
  where reservation_id is not null;


create index notifications_payment_idx
  on public.notifications (payment_id)
  where payment_id is not null;


create index notifications_invitation_idx
  on public.notifications (invitation_id)
  where invitation_id is not null;



-- =========================================================
-- ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger barbershops_set_updated_at
before update on public.barbershops
for each row
execute function public.set_updated_at();

create trigger barbershop_memberships_set_updated_at
before update on public.barbershop_memberships
for each row
execute function public.set_updated_at();

create trigger barbers_set_updated_at
before update on public.barbers
for each row
execute function public.set_updated_at();

create trigger barbershop_invitations_set_updated_at
before update on public.barbershop_invitations
for each row
execute function public.set_updated_at();

create trigger services_set_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

create trigger styles_set_updated_at
before update on public.styles
for each row
execute function public.set_updated_at();

create trigger barbershop_hours_set_updated_at
before update on public.barbershop_hours
for each row
execute function public.set_updated_at();

create trigger barber_schedules_set_updated_at
before update on public.barber_schedules
for each row
execute function public.set_updated_at();

create trigger barber_blocks_set_updated_at
before update on public.barber_blocks
for each row
execute function public.set_updated_at();

create trigger barbershop_closures_set_updated_at
before update on public.barbershop_closures
for each row
execute function public.set_updated_at();

create trigger barbershop_settings_set_updated_at
before update on public.barbershop_settings
for each row
execute function public.set_updated_at();

create trigger reservations_set_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();



-- =========================================================
-- CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRAR UN USUARIO
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  );

  return new;
end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- =========================================================
-- ESQUEMA PRIVADO PARA FUNCIONES DE AUTORIZACIÓN
-- =========================================================

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;


-- =========================================================
-- ¿EL USUARIO ACTUAL ES ADMINISTRADOR DE ESTA BARBERÍA?
-- =========================================================

create or replace function private.is_barbershop_admin(
  p_barbershop_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.barbershop_memberships as membership
    where membership.barbershop_id = p_barbershop_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'administrator'
      and membership.status = 'active'
  );
$$;


-- =========================================================
-- ¿EL USUARIO ACTUAL ES MIEMBRO ACTIVO DE ESTA BARBERÍA?
-- BARBERO O ADMINISTRADOR
-- =========================================================

create or replace function private.is_barbershop_member(
  p_barbershop_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.barbershop_memberships as membership
    where membership.barbershop_id = p_barbershop_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;


-- =========================================================
-- ¿EL USUARIO ACTUAL ES EL BARBERO INDICADO?
-- También funciona para un ADMINISTRADOR que además sea barbero.
-- =========================================================

create or replace function private.is_own_barber(
  p_barber_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.barbers as barber
    inner join public.barbershop_memberships as membership
      on membership.barbershop_id = barber.barbershop_id
     and membership.user_id = barber.user_id
    where barber.id = p_barber_id
      and barber.user_id = (select auth.uid())
      and barber.is_active = true
      and membership.status = 'active'
  );
$$;


-- =========================================================
-- ¿EL USUARIO ACTUAL ES DESTINATARIO DE LA INVITACIÓN?
-- El correo se toma de auth.users, no de metadata editable del JWT.
-- =========================================================

create or replace function private.is_invitation_recipient(
  p_invitation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.barbershop_invitations as invitation
    inner join auth.users as auth_user
      on auth_user.id = (select auth.uid())
    where invitation.id = p_invitation_id
      and (
        invitation.recipient_user_id = auth_user.id
        or lower(trim(invitation.email)) =
           lower(trim(auth_user.email))
      )
  );
$$;


-- =========================================================
-- RESTRINGIR EJECUCIÓN DE LAS FUNCIONES
-- =========================================================

revoke execute
  on function private.is_barbershop_admin(uuid)
  from public, anon;

revoke execute
  on function private.is_barbershop_member(uuid)
  from public, anon;

revoke execute
  on function private.is_own_barber(uuid)
  from public, anon;

revoke execute
  on function private.is_invitation_recipient(uuid)
  from public, anon;


grant execute
  on function private.is_barbershop_admin(uuid)
  to authenticated;

grant execute
  on function private.is_barbershop_member(uuid)
  to authenticated;

grant execute
  on function private.is_own_barber(uuid)
  to authenticated;

grant execute
  on function private.is_invitation_recipient(uuid)
  to authenticated;


-- =========================================================
-- SEPARAR CONFIGURACIÓN DE PAGOS DE LOS DATOS PÚBLICOS
-- =========================================================

alter table public.barbershops
  drop column yape_qr_url,
  drop column yape_holder_name,
  drop column yape_phone;


-- =========================================================
-- CONFIGURACIÓN DE PAGOS DE LA BARBERÍA
-- =========================================================

create table public.barbershop_payment_settings (
  barbershop_id uuid primary key
    references public.barbershops(id) on delete cascade,

  yape_qr_url text,
  yape_holder_name text,
  yape_phone text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barbershop_payment_settings_holder_check
    check (
      yape_holder_name is null
      or char_length(trim(yape_holder_name)) between 2 and 120
    ),

  constraint barbershop_payment_settings_phone_check
    check (
      yape_phone is null
      or char_length(trim(yape_phone)) between 7 and 30
    )
);


create trigger barbershop_payment_settings_set_updated_at
before update on public.barbershop_payment_settings
for each row
execute function public.set_updated_at();



-- =========================================================
-- ROW LEVEL SECURITY - HABILITACIÓN GENERAL
-- =========================================================

alter table public.profiles enable row level security;
alter table public.barbershops enable row level security;
alter table public.barbershop_memberships enable row level security;
alter table public.barbers enable row level security;
alter table public.barbershop_invitations enable row level security;
alter table public.services enable row level security;
alter table public.styles enable row level security;
alter table public.barber_services enable row level security;
alter table public.barbershop_hours enable row level security;
alter table public.barber_schedules enable row level security;
alter table public.barber_blocks enable row level security;
alter table public.barbershop_closures enable row level security;
alter table public.barbershop_settings enable row level security;
alter table public.barbershop_payment_settings enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_services enable row level security;
alter table public.payments enable row level security;
alter table public.favorite_barbershops enable row level security;
alter table public.notifications enable row level security;


-- =========================================================
-- PROFILES - PRIVILEGIOS
-- =========================================================

revoke all on table public.profiles
from anon, authenticated;

grant select
on table public.profiles
to authenticated;

grant update (
  full_name,
  phone,
  avatar_url
)
on table public.profiles
to authenticated;


-- =========================================================
-- PROFILES - RLS
-- Cada usuario solo puede ver y editar su propio perfil.
-- =========================================================

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
);


create policy profiles_update_own
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);


-- =========================================================
-- BARBERSHOPS - PRIVILEGIOS DE LECTURA
-- No exponemos created_by al cliente.
-- Las modificaciones se harán después mediante RPC.
-- =========================================================

revoke all on table public.barbershops
from anon, authenticated;

grant select (
  id,
  name,
  logo_url,
  description,
  phone,
  address,
  location_reference,
  status,
  created_at,
  updated_at
)
on table public.barbershops
to authenticated;


-- =========================================================
-- BARBERSHOPS - RLS DE LECTURA
--
-- CLIENTE:
--   puede ver PUBLICADA y PAUSADA.
--
-- PERSONAL:
--   también puede ver su barbería NO_PUBLICADA.
-- =========================================================

create policy barbershops_select_visible
on public.barbershops
for select
to authenticated
using (
  status in ('published', 'paused')
  or private.is_barbershop_member(id)
);



-- =========================================================
-- MEMBRESÍAS - PRIVILEGIOS
-- =========================================================

revoke all on table public.barbershop_memberships
from anon, authenticated;

grant select
on table public.barbershop_memberships
to authenticated;


-- Miembro:
--   ve su propia membresía.
-- Administrador:
--   ve todas las membresías de su barbería.
create policy barbershop_memberships_select
on public.barbershop_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_barbershop_admin(barbershop_id)
);


-- =========================================================
-- BARBEROS - PRIVILEGIOS
-- =========================================================

revoke all on table public.barbers
from anon, authenticated;

-- No exponemos user_id públicamente.
grant select (
  id,
  barbershop_id,
  display_name,
  bio,
  photo_url,
  is_active,
  created_at,
  updated_at
)
on table public.barbers
to authenticated;


-- CLIENTE:
--   ve barberos activos de barberías publicadas o pausadas.
--
-- PERSONAL:
--   también puede consultar barberos de su propia barbería,
--   incluso si están inactivos.
create policy barbers_select_visible
on public.barbers
for select
to authenticated
using (
  (
    is_active = true
    and exists (
      select 1
      from public.barbershops as shop
      where shop.id = barbers.barbershop_id
        and shop.status in ('published', 'paused')
    )
  )
  or private.is_barbershop_member(barbershop_id)
);


-- =========================================================
-- SERVICIOS - PRIVILEGIOS
-- =========================================================

revoke all on table public.services
from anon, authenticated;

grant select
on table public.services
to authenticated;


-- CLIENTE:
--   ve servicios activos de barberías visibles.
--
-- PERSONAL:
--   puede consultar también servicios inactivos
--   de su propia barbería.
create policy services_select_visible
on public.services
for select
to authenticated
using (
  (
    is_active = true
    and exists (
      select 1
      from public.barbershops as shop
      where shop.id = services.barbershop_id
        and shop.status in ('published', 'paused')
    )
  )
  or private.is_barbershop_member(barbershop_id)
);


-- =========================================================
-- ESTILOS - PRIVILEGIOS
-- =========================================================

revoke all on table public.styles
from anon, authenticated;

grant select
on table public.styles
to authenticated;


-- Un estilo es visible para clientes cuando:
--   - está activo,
--   - su servicio está activo,
--   - la barbería está publicada o pausada.
--
-- El personal puede consultar también estilos inactivos
-- pertenecientes a su barbería.
create policy styles_select_visible
on public.styles
for select
to authenticated
using (
  exists (
    select 1
    from public.services as service
    where service.id = styles.service_id
      and (
        (
          styles.is_active = true
          and service.is_active = true
          and exists (
            select 1
            from public.barbershops as shop
            where shop.id = service.barbershop_id
              and shop.status in ('published', 'paused')
          )
        )
        or private.is_barbershop_member(service.barbershop_id)
      )
  )
);


-- =========================================================
-- SERVICIOS ASIGNADOS A BARBEROS - PRIVILEGIOS
-- =========================================================

revoke all on table public.barber_services
from anon, authenticated;

grant select
on table public.barber_services
to authenticated;


-- CLIENTE:
--   ve relaciones entre barberos y servicios
--   cuando ambos están activos y la barbería es visible.
--
-- PERSONAL:
--   puede consultar todas las asignaciones de su barbería.
create policy barber_services_select_visible
on public.barber_services
for select
to authenticated
using (
  private.is_barbershop_member(barbershop_id)

  or (
    exists (
      select 1
      from public.barbers as barber
      where barber.id = barber_services.barber_id
        and barber.barbershop_id = barber_services.barbershop_id
        and barber.is_active = true
    )

    and exists (
      select 1
      from public.services as service
      where service.id = barber_services.service_id
        and service.barbershop_id = barber_services.barbershop_id
        and service.is_active = true
    )

    and exists (
      select 1
      from public.barbershops as shop
      where shop.id = barber_services.barbershop_id
        and shop.status in ('published', 'paused')
    )
  )
);

-- =========================================================
-- INFORMACIÓN OPERATIVA - PRIVILEGIOS Y LECTURA
-- =========================================================

revoke all on table public.barbershop_invitations
from anon, authenticated;

grant select (
  id,
  barbershop_id,
  email,
  role,
  channel,
  status,
  expires_at,
  accepted_at,
  responded_at,
  created_at,
  updated_at
)
on table public.barbershop_invitations
to authenticated;

create policy barbershop_invitations_select
on public.barbershop_invitations
for select
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
  or private.is_invitation_recipient(id)
);


revoke all on table public.barbershop_hours
from anon, authenticated;

grant select
on table public.barbershop_hours
to authenticated;

create policy barbershop_hours_select
on public.barbershop_hours
for select
to authenticated
using (
  private.is_barbershop_member(barbershop_id)
  or exists (
    select 1
    from public.barbershops as shop
    where shop.id = barbershop_hours.barbershop_id
      and shop.status in ('published', 'paused')
  )
);


revoke all on table public.barber_schedules
from anon, authenticated;

grant select
on table public.barber_schedules
to authenticated;

create policy barber_schedules_select
on public.barber_schedules
for select
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
  or private.is_own_barber(barber_id)
);


revoke all on table public.barber_blocks
from anon, authenticated;

grant select
on table public.barber_blocks
to authenticated;

create policy barber_blocks_select
on public.barber_blocks
for select
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
  or private.is_own_barber(barber_id)
);


revoke all on table public.barbershop_closures
from anon, authenticated;

grant select
on table public.barbershop_closures
to authenticated;

create policy barbershop_closures_select
on public.barbershop_closures
for select
to authenticated
using (
  private.is_barbershop_member(barbershop_id)
);


revoke all on table public.barbershop_settings
from anon, authenticated;

grant select
on table public.barbershop_settings
to authenticated;

create policy barbershop_settings_select
on public.barbershop_settings
for select
to authenticated
using (
  private.is_barbershop_member(barbershop_id)
  or exists (
    select 1
    from public.barbershops as shop
    where shop.id = barbershop_settings.barbershop_id
      and shop.status in ('published', 'paused')
  )
);


revoke all on table public.barbershop_payment_settings
from anon, authenticated;

grant select (
  barbershop_id,
  yape_qr_url,
  yape_holder_name,
  yape_phone,
  updated_at
)
on table public.barbershop_payment_settings
to authenticated;

create policy barbershop_payment_settings_select
on public.barbershop_payment_settings
for select
to authenticated
using (
  private.is_barbershop_member(barbershop_id)
  or exists (
    select 1
    from public.barbershops as shop
    where shop.id = barbershop_payment_settings.barbershop_id
      and shop.status in ('published', 'paused')
  )
);


-- =========================================================
-- RESERVAS
-- =========================================================

revoke all on table public.reservations
from anon, authenticated;

grant select
on table public.reservations
to authenticated;


-- CLIENTE:
--   solo sus propias reservas.
--
-- BARBERO:
--   solo reservas asignadas a él.
--
-- ADMINISTRADOR:
--   todas las reservas de su barbería.
create policy reservations_select
on public.reservations
for select
to authenticated
using (
  client_id = (select auth.uid())
  or private.is_own_barber(barber_id)
  or private.is_barbershop_admin(barbershop_id)
);


-- =========================================================
-- SERVICIOS DE CADA RESERVA
-- =========================================================

revoke all on table public.reservation_services
from anon, authenticated;

grant select
on table public.reservation_services
to authenticated;


create policy reservation_services_select
on public.reservation_services
for select
to authenticated
using (
  exists (
    select 1
    from public.reservations as reservation
    where reservation.id = reservation_services.reservation_id
      and reservation.barbershop_id =
          reservation_services.barbershop_id
      and (
        reservation.client_id = (select auth.uid())
        or private.is_own_barber(reservation.barber_id)
        or private.is_barbershop_admin(
          reservation.barbershop_id
        )
      )
  )
);


-- =========================================================
-- PAGOS
-- =========================================================

revoke all on table public.payments
from anon, authenticated;

grant select (
  id,
  reservation_id,
  barbershop_id,
  method,
  status,
  amount,
  confirmed_at,
  refunded_at,
  created_at,
  updated_at
)
on table public.payments
to authenticated;


-- CLIENTE:
--   puede consultar el pago de su propia reserva.
--
-- BARBERO:
--   puede consultar pagos de reservas asignadas a él.
--
-- ADMINISTRADOR:
--   puede consultar todos los pagos de su barbería.
create policy payments_select
on public.payments
for select
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)

  or exists (
    select 1
    from public.reservations as reservation
    where reservation.id = payments.reservation_id
      and reservation.barbershop_id =
          payments.barbershop_id
      and (
        reservation.client_id = (select auth.uid())
        or private.is_own_barber(reservation.barber_id)
      )
  )
);


-- =========================================================
-- FAVORITOS DEL CLIENTE
-- Esta información sí puede gestionarse directamente
-- mediante RLS porque pertenece exclusivamente al usuario.
-- =========================================================

revoke all on table public.favorite_barbershops
from anon, authenticated;

grant select
on table public.favorite_barbershops
to authenticated;

grant insert (
  user_id,
  barbershop_id,
  is_primary
)
on table public.favorite_barbershops
to authenticated;

grant update (
  is_primary
)
on table public.favorite_barbershops
to authenticated;

grant delete
on table public.favorite_barbershops
to authenticated;


create policy favorite_barbershops_select_own
on public.favorite_barbershops
for select
to authenticated
using (
  user_id = (select auth.uid())
);


create policy favorite_barbershops_insert_own
on public.favorite_barbershops
for insert
to authenticated
with check (
  user_id = (select auth.uid())

  and exists (
    select 1
    from public.barbershops as shop
    where shop.id = favorite_barbershops.barbershop_id
      and shop.status in ('published', 'paused')
  )
);


create policy favorite_barbershops_update_own
on public.favorite_barbershops
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);


create policy favorite_barbershops_delete_own
on public.favorite_barbershops
for delete
to authenticated
using (
  user_id = (select auth.uid())
);


-- =========================================================
-- NOTIFICACIONES
-- El usuario solo puede consultar sus propias notificaciones
-- y modificar exclusivamente su estado de lectura.
-- =========================================================

revoke all on table public.notifications
from anon, authenticated;

grant select
on table public.notifications
to authenticated;

grant update (
  is_read,
  read_at
)
on table public.notifications
to authenticated;


create policy notifications_select_own
on public.notifications
for select
to authenticated
using (
  user_id = (select auth.uid())
);


create policy notifications_update_read_state
on public.notifications
for update
to authenticated
using (
  user_id = (select auth.uid())
)
with check (
  user_id = (select auth.uid())
);




-- =========================================================
-- CREAR BARBERÍA
-- Crea:
--   1. Barbería
--   2. Configuración operativa
--   3. Configuración de pagos
--   4. Primera membresía ADMINISTRADOR
-- =========================================================

create or replace function private.create_barbershop_impl(
  p_name text,
  p_description text,
  p_phone text,
  p_address text,
  p_location_reference text,
  p_logo_url text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_barbershop_id uuid;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
  ) then
    raise exception 'User profile not found'
      using errcode = '23503';
  end if;

  if p_name is null
     or char_length(trim(p_name)) < 2
     or char_length(trim(p_name)) > 120 then
    raise exception 'Invalid barbershop name'
      using errcode = '22023';
  end if;


  -- -------------------------------------------------------
  -- Crear barbería
  -- -------------------------------------------------------

  insert into public.barbershops (
    created_by,
    name,
    logo_url,
    description,
    phone,
    address,
    location_reference,
    status
  )
  values (
    v_user_id,
    trim(p_name),
    nullif(trim(p_logo_url), ''),
    nullif(trim(p_description), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_address), ''),
    nullif(trim(p_location_reference), ''),
    'unpublished'
  )
  returning id into v_barbershop_id;


  -- -------------------------------------------------------
  -- Crear configuración predeterminada
  -- -------------------------------------------------------

  insert into public.barbershop_settings (
    barbershop_id
  )
  values (
    v_barbershop_id
  );


  -- -------------------------------------------------------
  -- Crear configuración de pagos vacía
  -- -------------------------------------------------------

  insert into public.barbershop_payment_settings (
    barbershop_id
  )
  values (
    v_barbershop_id
  );


  -- -------------------------------------------------------
  -- Convertir al creador en primer ADMINISTRADOR
  -- -------------------------------------------------------

  insert into public.barbershop_memberships (
    barbershop_id,
    user_id,
    role,
    status
  )
  values (
    v_barbershop_id,
    v_user_id,
    'administrator',
    'active'
  );


  return v_barbershop_id;
end;
$$;


-- =========================================================
-- PERMISOS DE LA FUNCIÓN PRIVADA
-- =========================================================

revoke execute
on function private.create_barbershop_impl(
  text,
  text,
  text,
  text,
  text,
  text
)
from public, anon;

-- =========================================================
-- RPC PÚBLICA PARA LA APP
-- =========================================================

create or replace function public.create_barbershop(
  p_name text,
  p_description text default null,
  p_phone text default null,
  p_address text default null,
  p_location_reference text default null,
  p_logo_url text default null
)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select private.create_barbershop_impl(
    p_name,
    p_description,
    p_phone,
    p_address,
    p_location_reference,
    p_logo_url
  );
$$;


revoke execute
on function public.create_barbershop(
  text,
  text,
  text,
  text,
  text,
  text
)
from public, anon;

grant execute
on function public.create_barbershop(
  text,
  text,
  text,
  text,
  text,
  text
)
to authenticated;



-- =========================================================
-- ACTUALIZAR DATOS GENERALES DE UNA BARBERÍA
-- =========================================================

create or replace function private.update_barbershop_impl(
  p_barbershop_id uuid,
  p_name text,
  p_description text,
  p_phone text,
  p_address text,
  p_location_reference text,
  p_logo_url text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  if p_name is null
     or char_length(trim(p_name)) < 2
     or char_length(trim(p_name)) > 120 then
    raise exception 'Invalid barbershop name'
      using errcode = '22023';
  end if;

  update public.barbershops
  set
    name = trim(p_name),
    description = nullif(trim(p_description), ''),
    phone = nullif(trim(p_phone), ''),
    address = nullif(trim(p_address), ''),
    location_reference = nullif(trim(p_location_reference), ''),
    logo_url = nullif(trim(p_logo_url), '')
  where id = p_barbershop_id;

  if not found then
    raise exception 'Barbershop not found'
      using errcode = 'P0002';
  end if;
end;
$$;


revoke execute
on function private.update_barbershop_impl(
  uuid, text, text, text, text, text, text
)
from public, anon;

create or replace function public.update_barbershop(
  p_barbershop_id uuid,
  p_name text,
  p_description text default null,
  p_phone text default null,
  p_address text default null,
  p_location_reference text default null,
  p_logo_url text default null
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.update_barbershop_impl(
    p_barbershop_id,
    p_name,
    p_description,
    p_phone,
    p_address,
    p_location_reference,
    p_logo_url
  );
$$;


revoke execute
on function public.update_barbershop(
  uuid, text, text, text, text, text, text
)
from public, anon;

grant execute
on function public.update_barbershop(
  uuid, text, text, text, text, text, text
)
to authenticated;


-- =========================================================
-- ACTUALIZAR POLÍTICAS OPERATIVAS
-- =========================================================

create or replace function private.update_barbershop_settings_impl(
  p_barbershop_id uuid,
  p_min_booking_notice_minutes integer,
  p_max_booking_days integer,
  p_slot_interval_minutes integer,
  p_appointment_buffer_minutes integer,
  p_cancellation_notice_minutes integer,
  p_late_cancellation_refund_policy public.late_cancellation_refund_policy
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  update public.barbershop_settings
  set
    min_booking_notice_minutes = p_min_booking_notice_minutes,
    max_booking_days = p_max_booking_days,
    slot_interval_minutes = p_slot_interval_minutes,
    appointment_buffer_minutes = p_appointment_buffer_minutes,
    cancellation_notice_minutes = p_cancellation_notice_minutes,
    late_cancellation_refund_policy =
      p_late_cancellation_refund_policy
  where barbershop_id = p_barbershop_id;

  if not found then
    raise exception 'Barbershop settings not found'
      using errcode = 'P0002';
  end if;
end;
$$;


revoke execute
on function private.update_barbershop_settings_impl(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer,
  public.late_cancellation_refund_policy
)
from public, anon;

create or replace function public.update_barbershop_settings(
  p_barbershop_id uuid,
  p_min_booking_notice_minutes integer,
  p_max_booking_days integer,
  p_slot_interval_minutes integer,
  p_appointment_buffer_minutes integer,
  p_cancellation_notice_minutes integer,
  p_late_cancellation_refund_policy public.late_cancellation_refund_policy
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.update_barbershop_settings_impl(
    p_barbershop_id,
    p_min_booking_notice_minutes,
    p_max_booking_days,
    p_slot_interval_minutes,
    p_appointment_buffer_minutes,
    p_cancellation_notice_minutes,
    p_late_cancellation_refund_policy
  );
$$;


revoke execute
on function public.update_barbershop_settings(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer,
  public.late_cancellation_refund_policy
)
from public, anon;

grant execute
on function public.update_barbershop_settings(
  uuid,
  integer,
  integer,
  integer,
  integer,
  integer,
  public.late_cancellation_refund_policy
)
to authenticated;


-- =========================================================
-- ACTUALIZAR CONFIGURACIÓN DE YAPE
-- =========================================================

create or replace function private.update_yape_settings_impl(
  p_barbershop_id uuid,
  p_yape_qr_url text,
  p_yape_holder_name text,
  p_yape_phone text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  update public.barbershop_payment_settings
  set
    yape_qr_url = nullif(trim(p_yape_qr_url), ''),
    yape_holder_name = nullif(trim(p_yape_holder_name), ''),
    yape_phone = nullif(trim(p_yape_phone), '')
  where barbershop_id = p_barbershop_id;

  if not found then
    raise exception 'Payment settings not found'
      using errcode = 'P0002';
  end if;
end;
$$;


revoke execute
on function private.update_yape_settings_impl(
  uuid, text, text, text
)
from public, anon;

create or replace function public.update_yape_settings(
  p_barbershop_id uuid,
  p_yape_qr_url text default null,
  p_yape_holder_name text default null,
  p_yape_phone text default null
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.update_yape_settings_impl(
    p_barbershop_id,
    p_yape_qr_url,
    p_yape_holder_name,
    p_yape_phone
  );
$$;


revoke execute
on function public.update_yape_settings(
  uuid, text, text, text
)
from public, anon;

grant execute
on function public.update_yape_settings(
  uuid, text, text, text
)
to authenticated;


-- =========================================================
-- PUBLICAR BARBERÍA
--
-- Requisitos mínimos:
--   - teléfono
--   - dirección
--   - horario general
--   - al menos un servicio activo
--   - al menos un barbero activo
--   - ese barbero debe tener horario configurado
-- =========================================================

create or replace function private.publish_barbershop_impl(
  p_barbershop_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;


  if not exists (
    select 1
    from public.barbershops as shop
    where shop.id = p_barbershop_id
      and shop.phone is not null
      and char_length(trim(shop.phone)) >= 7
      and shop.address is not null
      and char_length(trim(shop.address)) > 0
  ) then
    raise exception 'Complete the required barbershop information'
      using errcode = '22023';
  end if;


  if not exists (
    select 1
    from public.barbershop_hours as hours
    where hours.barbershop_id = p_barbershop_id
  ) then
    raise exception 'Configure barbershop opening hours first'
      using errcode = '22023';
  end if;


  if not exists (
    select 1
    from public.services as service
    where service.barbershop_id = p_barbershop_id
      and service.is_active = true
  ) then
    raise exception 'At least one active service is required'
      using errcode = '22023';
  end if;


  if not exists (
    select 1
    from public.barbers as barber
    inner join public.barbershop_memberships as membership
      on membership.barbershop_id = barber.barbershop_id
     and membership.user_id = barber.user_id
    where barber.barbershop_id = p_barbershop_id
      and barber.is_active = true
      and membership.status = 'active'
      and exists (
        select 1
        from public.barber_schedules as schedule
        where schedule.barber_id = barber.id
          and schedule.barbershop_id = barber.barbershop_id
      )
  ) then
    raise exception
      'At least one active barber with a configured schedule is required'
      using errcode = '22023';
  end if;


  update public.barbershops
  set status = 'published'
  where id = p_barbershop_id;
end;
$$;


revoke execute
on function private.publish_barbershop_impl(uuid)
from public, anon;

create or replace function public.publish_barbershop(
  p_barbershop_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.publish_barbershop_impl(
    p_barbershop_id
  );
$$;


revoke execute
on function public.publish_barbershop(uuid)
from public, anon;

grant execute
on function public.publish_barbershop(uuid)
to authenticated;


-- =========================================================
-- PAUSAR BARBERÍA
-- Sigue visible, pero no admite nuevas reservas.
-- =========================================================

create or replace function private.pause_barbershop_impl(
  p_barbershop_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  update public.barbershops
  set status = 'paused'
  where id = p_barbershop_id;

  if not found then
    raise exception 'Barbershop not found'
      using errcode = 'P0002';
  end if;
end;
$$;


create or replace function public.pause_barbershop(
  p_barbershop_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.pause_barbershop_impl(
    p_barbershop_id
  );
$$;


-- =========================================================
-- DESPUBLICAR BARBERÍA
-- Deja de aparecer en búsquedas.
-- =========================================================

create or replace function private.unpublish_barbershop_impl(
  p_barbershop_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  update public.barbershops
  set status = 'unpublished'
  where id = p_barbershop_id;

  if not found then
    raise exception 'Barbershop not found'
      using errcode = 'P0002';
  end if;
end;
$$;


create or replace function public.unpublish_barbershop(
  p_barbershop_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.unpublish_barbershop_impl(
    p_barbershop_id
  );
$$;


-- =========================================================
-- RESTRINGIR RPC DE ESTADOS
-- =========================================================

revoke execute
on function private.pause_barbershop_impl(uuid)
from public, anon;

revoke execute
on function private.unpublish_barbershop_impl(uuid)
from public, anon;

revoke execute
on function public.pause_barbershop(uuid)
from public, anon;

revoke execute
on function public.unpublish_barbershop(uuid)
from public, anon;


grant execute
on function public.pause_barbershop(uuid)
to authenticated;

grant execute
on function public.unpublish_barbershop(uuid)
to authenticated;



-- =========================================================
-- ENVIAR INVITACIÓN A UNA BARBERÍA
-- channel:
--   app   -> notifica en la app cuando la cuenta ya existe
--   email -> puede tener cuenta o registrarse después
-- =========================================================

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

  -- Buscar si ya existe una cuenta con ese correo.
  select u.id
  into v_recipient_user_id
  from auth.users as u
  where lower(trim(u.email)) = v_email
  limit 1;

  -- Liberar invitaciones vencidas antes de comprobar duplicados.
  update public.barbershop_invitations
  set
    status = 'expired',
    responded_at = now()
  where barbershop_id = p_barbershop_id
    and role = p_role
    and status = 'pending'
    and expires_at <= now()
    and lower(trim(email)) = v_email;

  -- El índice único parcial es la autoridad ante concurrencia.
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

  -- Si ya tiene cuenta, también recibe aviso dentro de la app.
  if v_recipient_user_id is not null then
    insert into public.notifications (
      user_id,
      barbershop_id,
      type,
      title,
      message,
      invitation_id
    )
    values (
      v_recipient_user_id,
      p_barbershop_id,
      'invitation_received',
      'Nueva invitación',
      'Has recibido una invitación para unirte a una barbería.',
      v_invitation_id
    );
  end if;

  return v_invitation_id;
end;
$$;


create or replace function public.send_barbershop_invitation(
  p_barbershop_id uuid,
  p_email text,
  p_role public.membership_role,
  p_channel public.invitation_channel
)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select private.send_barbershop_invitation_impl(
    p_barbershop_id,
    p_email,
    p_role,
    p_channel
  );
$$;


revoke execute
on function private.send_barbershop_invitation_impl(
  uuid,
  text,
  public.membership_role,
  public.invitation_channel
)
from public, anon;

revoke execute
on function public.send_barbershop_invitation(
  uuid,
  text,
  public.membership_role,
  public.invitation_channel
)
from public, anon;

grant execute
on function public.send_barbershop_invitation(
  uuid,
  text,
  public.membership_role,
  public.invitation_channel
)
to authenticated;


-- =========================================================
-- ACEPTAR INVITACIÓN
-- Si es BARBERO también crea/reactiva su perfil profesional.
-- =========================================================

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

  if exists (
    select 1
    from public.barbershop_memberships as membership
    where membership.barbershop_id = v_invitation.barbershop_id
      and membership.user_id = v_user_id
      and membership.status = 'active'
  ) then
    raise exception 'User is already an active member'
      using errcode = '23505';
  end if;

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

  -- Si la invitación era para BARBERO,
  -- crear/reactivar su perfil profesional.
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


create or replace function public.accept_barbershop_invitation(
  p_invitation_id uuid,
  p_display_name text default null,
  p_bio text default null,
  p_photo_url text default null
)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select private.accept_barbershop_invitation_impl(
    p_invitation_id,
    p_display_name,
    p_bio,
    p_photo_url
  );
$$;


revoke execute
on function private.accept_barbershop_invitation_impl(
  uuid, text, text, text
)
from public, anon;

revoke execute
on function public.accept_barbershop_invitation(
  uuid, text, text, text
)
from public, anon;

grant execute
on function public.accept_barbershop_invitation(
  uuid, text, text, text
)
to authenticated;


-- =========================================================
-- RECHAZAR INVITACIÓN
-- =========================================================

create or replace function private.reject_barbershop_invitation_impl(
  p_invitation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_invitation public.barbershop_invitations%rowtype;
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

    return;
  end if;

  update public.barbershop_invitations
  set
    status = 'rejected',
    responded_at = now()
  where id = p_invitation_id;
end;
$$;


create or replace function public.reject_barbershop_invitation(
  p_invitation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.reject_barbershop_invitation_impl(
    p_invitation_id
  );
$$;


-- =========================================================
-- CANCELAR INVITACIÓN
-- Solo ADMINISTRADOR.
-- =========================================================

create or replace function private.cancel_barbershop_invitation_impl(
  p_invitation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.barbershop_invitations as invitation
  where invitation.id = p_invitation_id
    and invitation.status = 'pending'
    and private.is_barbershop_admin(
      invitation.barbershop_id
    )
  for update;

  if not found then
    raise exception 'Pending invitation not found'
      using errcode = 'P0002';
  end if;

  update public.barbershop_invitations
  set
    status = 'cancelled',
    responded_at = now()
  where id = p_invitation_id;
end;
$$;


create or replace function public.cancel_barbershop_invitation(
  p_invitation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.cancel_barbershop_invitation_impl(
    p_invitation_id
  );
$$;


-- =========================================================
-- ADMINISTRADOR QUE TAMBIÉN QUIERE ATENDER COMO BARBERO
-- =========================================================

create or replace function private.enable_own_barber_profile_impl(
  p_barbershop_id uuid,
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
  v_barber_id uuid;
  v_display_name text;
begin
  v_user_id := (select auth.uid());

  if not private.is_barbershop_admin(p_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

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
    raise exception 'A valid display name is required'
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
    p_barbershop_id,
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
    is_active = true
  returning id into v_barber_id;

  return v_barber_id;
end;
$$;


create or replace function public.enable_own_barber_profile(
  p_barbershop_id uuid,
  p_display_name text default null,
  p_bio text default null,
  p_photo_url text default null
)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select private.enable_own_barber_profile_impl(
    p_barbershop_id,
    p_display_name,
    p_bio,
    p_photo_url
  );
$$;


-- =========================================================
-- DESACTIVAR BARBERO
-- Puede hacerlo:
--   - el propio barbero
--   - un ADMINISTRADOR de la barbería
--
-- No puede tener reservas futuras activas.
-- =========================================================

create or replace function private.deactivate_barber_impl(
  p_barber_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_barbershop_id uuid;
  v_user_id uuid;
  v_membership_role public.membership_role;
begin
  select
    barber.barbershop_id,
    barber.user_id
  into
    v_barbershop_id,
    v_user_id
  from public.barbers as barber
  where barber.id = p_barber_id
    and barber.is_active = true
  for update;

  if not found then
    raise exception 'Active barber not found'
      using errcode = 'P0002';
  end if;

  if not (
    private.is_barbershop_admin(v_barbershop_id)
    or v_user_id = (select auth.uid())
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  -- Primero deben gestionarse las reservas futuras.
  if exists (
    select 1
    from public.reservations as reservation
    where reservation.barber_id = p_barber_id
      and (
        reservation.status = 'in_progress'
        or (
          reservation.status = 'confirmed'
          and reservation.starts_at >= now()
        )
      )
  ) then
    raise exception
      'Barber has active future reservations that must be managed first'
      using errcode = '23514';
  end if;

  update public.barbers
  set is_active = false
  where id = p_barber_id;

  select membership.role
  into v_membership_role
  from public.barbershop_memberships as membership
  where membership.barbershop_id = v_barbershop_id
    and membership.user_id = v_user_id;

  -- Si solamente era BARBERO, también desactivamos
  -- su membresía con esta barbería.
  --
  -- Si es ADMINISTRADOR que también cortaba cabello,
  -- mantiene su acceso administrativo.
  if v_membership_role = 'barber' then
    update public.barbershop_memberships
    set status = 'inactive'
    where barbershop_id = v_barbershop_id
      and user_id = v_user_id;
  end if;
end;
$$;


create or replace function public.deactivate_barber(
  p_barber_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.deactivate_barber_impl(
    p_barber_id
  );
$$;


-- =========================================================
-- PERMISOS DE LAS RPC RESTANTES
-- =========================================================

revoke execute
on function private.reject_barbershop_invitation_impl(uuid)
from public, anon;

revoke execute
on function private.cancel_barbershop_invitation_impl(uuid)
from public, anon;

revoke execute
on function private.enable_own_barber_profile_impl(
  uuid, text, text, text
)
from public, anon;

revoke execute
on function private.deactivate_barber_impl(uuid)
from public, anon;

revoke execute
on function public.reject_barbershop_invitation(uuid)
from public, anon;

revoke execute
on function public.cancel_barbershop_invitation(uuid)
from public, anon;

revoke execute
on function public.enable_own_barber_profile(
  uuid, text, text, text
)
from public, anon;

revoke execute
on function public.deactivate_barber(uuid)
from public, anon;


grant execute
on function public.reject_barbershop_invitation(uuid)
to authenticated;

grant execute
on function public.cancel_barbershop_invitation(uuid)
to authenticated;

grant execute
on function public.enable_own_barber_profile(
  uuid, text, text, text
)
to authenticated;

grant execute
on function public.deactivate_barber(uuid)
to authenticated;


-- =========================================================
-- EVITAR HORARIOS SEMANALES SOLAPADOS
-- =========================================================

alter table public.barbershop_hours
  add constraint barbershop_hours_no_overlap
  exclude using gist (
    barbershop_id with =,
    weekday with =,
    int4range(
      extract(epoch from start_time)::integer,
      extract(epoch from end_time)::integer,
      '[)'
    ) with &&
  );


alter table public.barber_schedules
  add constraint barber_schedules_no_overlap
  exclude using gist (
    barber_id with =,
    weekday with =,
    int4range(
      extract(epoch from start_time)::integer,
      extract(epoch from end_time)::integer,
      '[)'
    ) with &&
  );


-- =========================================================
-- INTEGRIDAD Y SERIALIZACIÓN DE AGENDA
-- La fila del barbero es el punto común de serialización con
-- creación/reprogramación de reservas, horarios y bloqueos.
-- =========================================================

create or replace function private.validate_barbershop_hours_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_barbershop_id uuid;
  v_new_weekday smallint;
  v_new_start_time time;
  v_new_end_time time;
begin
  if tg_op = 'DELETE' then
    v_barbershop_id := old.barbershop_id;
  else
    v_barbershop_id := new.barbershop_id;
    v_new_weekday := new.weekday;
    v_new_start_time := new.start_time;
    v_new_end_time := new.end_time;
  end if;

  if not private.is_barbershop_admin(v_barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  perform 1
  from public.barbershops
  where id = v_barbershop_id
  for update;

  perform 1
  from public.barbers
  where barbershop_id = v_barbershop_id
  order by id
  for update;

  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1
    from public.barber_schedules as schedule
    where schedule.barbershop_id = v_barbershop_id
      and not exists (
        select 1
        from (
          select
            hours.weekday,
            hours.start_time,
            hours.end_time
          from public.barbershop_hours as hours
          where hours.barbershop_id = v_barbershop_id
            and hours.id <> old.id

          union all

          select
            v_new_weekday,
            v_new_start_time,
            v_new_end_time
          where tg_op = 'UPDATE'
        ) as resulting_hours
        where resulting_hours.weekday = schedule.weekday
          and schedule.start_time >= resulting_hours.start_time
          and schedule.end_time <= resulting_hours.end_time
      )
  ) then
    raise exception
      'Barbershop hours change would invalidate a barber schedule'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;


create trigger barbershop_hours_validate_change
before insert or update or delete on public.barbershop_hours
for each row
execute function private.validate_barbershop_hours_change();


create or replace function private.validate_barber_schedule_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_barber_id uuid;
  v_barbershop_id uuid;
  v_new_weekday smallint;
  v_new_start_time time;
  v_new_end_time time;
begin
  if tg_op = 'DELETE' then
    v_barber_id := old.barber_id;
    v_barbershop_id := old.barbershop_id;
  else
    v_barber_id := new.barber_id;
    v_barbershop_id := new.barbershop_id;
    v_new_weekday := new.weekday;
    v_new_start_time := new.start_time;
    v_new_end_time := new.end_time;
  end if;

  if tg_op = 'UPDATE' and (
    new.barber_id <> old.barber_id
    or new.barbershop_id <> old.barbershop_id
  ) then
    raise exception 'A barber schedule cannot change owner'
      using errcode = '22023';
  end if;

  if not (
    private.is_barbershop_admin(v_barbershop_id)
    or private.is_own_barber(v_barber_id)
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  perform 1
  from public.barbershops
  where id = v_barbershop_id
  for update;

  perform 1
  from public.barbers
  where id = v_barber_id
    and barbershop_id = v_barbershop_id
  for update;

  if tg_op in ('INSERT', 'UPDATE') and not exists (
    select 1
    from public.barbershop_hours as hours
    where hours.barbershop_id = v_barbershop_id
      and hours.weekday = v_new_weekday
      and v_new_start_time >= hours.start_time
      and v_new_end_time <= hours.end_time
  ) then
    raise exception
      'Barber schedule must fit within barbershop hours'
      using errcode = '23514';
  end if;

  if tg_op in ('UPDATE', 'DELETE') and exists (
    select 1
    from public.reservations as reservation
    where reservation.barber_id = v_barber_id
      and reservation.barbershop_id = v_barbershop_id
      and reservation.status = 'confirmed'
      and reservation.starts_at > now()
      and not exists (
        select 1
        from (
          select
            schedule.weekday,
            schedule.start_time,
            schedule.end_time
          from public.barber_schedules as schedule
          where schedule.barber_id = v_barber_id
            and schedule.id <> old.id

          union all

          select
            v_new_weekday,
            v_new_start_time,
            v_new_end_time
          where tg_op = 'UPDATE'
        ) as resulting_schedules
        where resulting_schedules.weekday =
          extract(
            dow from reservation.starts_at
            at time zone 'America/Lima'
          )::smallint
          and (
            reservation.starts_at at time zone 'America/Lima'
          )::time >= resulting_schedules.start_time
          and (
            reservation.ends_at at time zone 'America/Lima'
          )::time <= resulting_schedules.end_time
      )
  ) then
    raise exception
      'Barber schedule change would invalidate a future reservation'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;


create trigger barber_schedules_validate_change
before insert or update or delete on public.barber_schedules
for each row
execute function private.validate_barber_schedule_change();


create or replace function private.validate_barber_block_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by <> (select auth.uid())
     or not (
       private.is_barbershop_admin(new.barbershop_id)
       or private.is_own_barber(new.barber_id)
     ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  perform 1
  from public.barbers
  where id = new.barber_id
    and barbershop_id = new.barbershop_id
  for update;

  if exists (
    select 1
    from public.reservations as reservation
    where reservation.barber_id = new.barber_id
      and reservation.barbershop_id = new.barbershop_id
      and reservation.status in ('confirmed', 'in_progress')
      and tstzrange(
        reservation.starts_at,
        reservation.occupied_until,
        '[)'
      ) && tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'Barber block overlaps an active reservation'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;


create trigger barber_blocks_validate_insert
before insert on public.barber_blocks
for each row
execute function private.validate_barber_block_insert();


create or replace function private.validate_barbershop_closure_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by <> (select auth.uid())
     or not private.is_barbershop_admin(new.barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  perform 1
  from public.barbershops
  where id = new.barbershop_id
  for update;

  perform 1
  from public.barbers
  where barbershop_id = new.barbershop_id
  order by id
  for update;

  if exists (
    select 1
    from public.reservations as reservation
    where reservation.barbershop_id = new.barbershop_id
      and reservation.status in ('confirmed', 'in_progress')
      and tstzrange(
        reservation.starts_at,
        reservation.occupied_until,
        '[)'
      ) && tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'Barbershop closure overlaps an active reservation'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;


create trigger barbershop_closures_validate_insert
before insert on public.barbershop_closures
for each row
execute function private.validate_barbershop_closure_insert();


create or replace function private.protect_future_barber_service()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_barbershop_admin(old.barbershop_id) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  perform 1
  from public.barbers
  where id = old.barber_id
    and barbershop_id = old.barbershop_id
  for update;

  if exists (
    select 1
    from public.reservations as reservation
    inner join public.reservation_services as reservation_service
      on reservation_service.reservation_id = reservation.id
     and reservation_service.barbershop_id = reservation.barbershop_id
    where reservation.barber_id = old.barber_id
      and reservation.barbershop_id = old.barbershop_id
      and (
        reservation.status = 'in_progress'
        or (
          reservation.status = 'confirmed'
          and reservation.starts_at > now()
        )
      )
      and reservation_service.service_id = old.service_id
  ) then
    raise exception
      'Service assignment is required by a future reservation'
      using errcode = '23514';
  end if;

  return old;
end;
$$;


create trigger barber_services_protect_future_reservations
before delete on public.barber_services
for each row
execute function private.protect_future_barber_service();


revoke execute
on function private.validate_barbershop_hours_change()
from public, anon, authenticated;

revoke execute
on function private.validate_barber_schedule_change()
from public, anon, authenticated;

revoke execute
on function private.validate_barber_block_insert()
from public, anon, authenticated;

revoke execute
on function private.validate_barbershop_closure_insert()
from public, anon, authenticated;

revoke execute
on function private.protect_future_barber_service()
from public, anon, authenticated;


-- =========================================================
-- SERVICIOS - ESCRITURA SOLO ADMINISTRADOR
-- No se eliminan: se desactivan para conservar historial.
-- =========================================================

grant insert (
  barbershop_id,
  name,
  description,
  price,
  duration_minutes,
  is_active
)
on table public.services
to authenticated;

grant update (
  name,
  description,
  price,
  duration_minutes,
  is_active
)
on table public.services
to authenticated;


create policy services_insert_admin
on public.services
for insert
to authenticated
with check (
  private.is_barbershop_admin(barbershop_id)
);


create policy services_update_admin
on public.services
for update
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
)
with check (
  private.is_barbershop_admin(barbershop_id)
);


-- =========================================================
-- ESTILOS - ESCRITURA SOLO ADMINISTRADOR
-- =========================================================

grant insert (
  service_id,
  name,
  description,
  image_url,
  is_active
)
on table public.styles
to authenticated;

grant update (
  name,
  description,
  image_url,
  is_active
)
on table public.styles
to authenticated;


create policy styles_insert_admin
on public.styles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.services as service
    where service.id = styles.service_id
      and private.is_barbershop_admin(service.barbershop_id)
  )
);


create policy styles_update_admin
on public.styles
for update
to authenticated
using (
  exists (
    select 1
    from public.services as service
    where service.id = styles.service_id
      and private.is_barbershop_admin(service.barbershop_id)
  )
)
with check (
  exists (
    select 1
    from public.services as service
    where service.id = styles.service_id
      and private.is_barbershop_admin(service.barbershop_id)
  )
);


-- =========================================================
-- ASIGNACIÓN DE SERVICIOS A BARBEROS
-- Solo administrador.
-- =========================================================

grant insert (
  barbershop_id,
  barber_id,
  service_id
)
on table public.barber_services
to authenticated;

grant delete
on table public.barber_services
to authenticated;


create policy barber_services_insert_admin
on public.barber_services
for insert
to authenticated
with check (
  private.is_barbershop_admin(barbershop_id)
);


create policy barber_services_delete_admin
on public.barber_services
for delete
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
);


-- =========================================================
-- HORARIO GENERAL DE BARBERÍA
-- Solo administrador modifica.
-- =========================================================

grant insert (
  barbershop_id,
  weekday,
  start_time,
  end_time
)
on table public.barbershop_hours
to authenticated;

grant update (
  weekday,
  start_time,
  end_time
)
on table public.barbershop_hours
to authenticated;

grant delete
on table public.barbershop_hours
to authenticated;


create policy barbershop_hours_insert_admin
on public.barbershop_hours
for insert
to authenticated
with check (
  private.is_barbershop_admin(barbershop_id)
);


create policy barbershop_hours_update_admin
on public.barbershop_hours
for update
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
)
with check (
  private.is_barbershop_admin(barbershop_id)
);


create policy barbershop_hours_delete_admin
on public.barbershop_hours
for delete
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
);


-- =========================================================
-- HORARIOS DE BARBEROS
-- Puede modificar:
--   - el propio barbero
--   - un administrador
--
-- El horario debe estar dentro del horario de la barbería.
-- =========================================================

grant insert (
  barbershop_id,
  barber_id,
  weekday,
  start_time,
  end_time
)
on table public.barber_schedules
to authenticated;

grant update (
  weekday,
  start_time,
  end_time
)
on table public.barber_schedules
to authenticated;

grant delete
on table public.barber_schedules
to authenticated;


create policy barber_schedules_insert
on public.barber_schedules
for insert
to authenticated
with check (
  (
    private.is_barbershop_admin(barbershop_id)
    or private.is_own_barber(barber_id)
  )

  and exists (
    select 1
    from public.barbershop_hours as hours
    where hours.barbershop_id = barber_schedules.barbershop_id
      and hours.weekday = barber_schedules.weekday
      and barber_schedules.start_time >= hours.start_time
      and barber_schedules.end_time <= hours.end_time
  )
);


create policy barber_schedules_update
on public.barber_schedules
for update
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
  or private.is_own_barber(barber_id)
)
with check (
  (
    private.is_barbershop_admin(barbershop_id)
    or private.is_own_barber(barber_id)
  )

  and exists (
    select 1
    from public.barbershop_hours as hours
    where hours.barbershop_id = barber_schedules.barbershop_id
      and hours.weekday = barber_schedules.weekday
      and barber_schedules.start_time >= hours.start_time
      and barber_schedules.end_time <= hours.end_time
  )
);


create policy barber_schedules_delete
on public.barber_schedules
for delete
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
  or private.is_own_barber(barber_id)
);


-- =========================================================
-- BLOQUEOS EXCEPCIONALES DEL BARBERO
-- Puede crear/eliminar:
--   - propio barbero
--   - administrador
--
-- NO puede bloquear una reserva activa existente.
-- =========================================================

grant insert (
  barbershop_id,
  barber_id,
  starts_at,
  ends_at,
  reason,
  created_by
)
on table public.barber_blocks
to authenticated;

grant delete
on table public.barber_blocks
to authenticated;


create policy barber_blocks_insert
on public.barber_blocks
for insert
to authenticated
with check (
  created_by = (select auth.uid())

  and (
    private.is_barbershop_admin(barbershop_id)
    or private.is_own_barber(barber_id)
  )

  and not exists (
    select 1
    from public.reservations as reservation
    where reservation.barber_id = barber_blocks.barber_id
      and reservation.barbershop_id = barber_blocks.barbershop_id
      and reservation.status in ('confirmed', 'in_progress')
      and tstzrange(
        reservation.starts_at,
        reservation.occupied_until,
        '[)'
      ) && tstzrange(
        barber_blocks.starts_at,
        barber_blocks.ends_at,
        '[)'
      )
  )
);


create policy barber_blocks_delete
on public.barber_blocks
for delete
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
  or private.is_own_barber(barber_id)
);


-- =========================================================
-- CIERRES EXCEPCIONALES DE TODA LA BARBERÍA
-- Solo administrador.
-- =========================================================

grant insert (
  barbershop_id,
  starts_at,
  ends_at,
  reason,
  created_by
)
on table public.barbershop_closures
to authenticated;

grant delete
on table public.barbershop_closures
to authenticated;


create policy barbershop_closures_insert_admin
on public.barbershop_closures
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_barbershop_admin(barbershop_id)
);


create policy barbershop_closures_delete_admin
on public.barbershop_closures
for delete
to authenticated
using (
  private.is_barbershop_admin(barbershop_id)
);


-- =========================================================
-- AJUSTES FINALES DE REPROGRAMACIÓN
-- =========================================================

alter table public.reservations
  add column is_late_reschedule boolean not null default false,
  add column refund_policy_at_late_action
    public.late_cancellation_refund_policy,
  add column is_refund_eligible boolean not null default true;


alter table public.reservations
  add constraint reservations_previous_barber_fk
  foreign key (previous_barber_id, barbershop_id)
  references public.barbers (id, barbershop_id)
  on delete restrict;


alter table public.reservations
  add constraint reservations_late_reschedule_check
  check (
    reschedule_count = 1
    or is_late_reschedule = false
  );


alter table public.reservations
  add constraint reservations_late_cancellation_check
  check (
    status = 'cancelled'
    or is_late_cancellation = false
  );


alter table public.reservations
  add constraint reservations_refund_eligibility_check
  check (
    (
      is_late_reschedule = false
      and is_late_cancellation = false
      and refund_policy_at_late_action is null
      and is_refund_eligible = true
    )
    or
    (
      (is_late_reschedule = true or is_late_cancellation = true)
      and refund_policy_at_late_action is not null
      and is_refund_eligible =
        (refund_policy_at_late_action = 'full_refund')
    )
  );


-- =========================================================
-- DISPONIBILIDAD
--
-- p_require_active_services:
--   true  -> reserva nueva
--   false -> reprogramación de una reserva existente
--
-- p_exclude_reservation_id:
--   permite ignorar la propia reserva al reprogramarla.
-- =========================================================

create or replace function private.get_available_slots_impl(
  p_barber_id uuid,
  p_service_ids uuid[],
  p_date date,
  p_duration_minutes integer default null,
  p_buffer_minutes integer default null,
  p_require_active_services boolean default true,
  p_exclude_reservation_id uuid default null
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_barbershop_id uuid;

  v_min_notice integer;
  v_max_days integer;
  v_slot_interval integer;
  v_default_buffer integer;

  v_service_count integer;
  v_current_duration integer;

  v_duration integer;
  v_buffer integer;

  v_today date;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- -------------------------------------------------------
  -- Validar servicios recibidos
  -- -------------------------------------------------------

  if p_service_ids is null
     or cardinality(p_service_ids) = 0 then
    raise exception 'At least one service is required'
      using errcode = '22023';
  end if;

  if cardinality(p_service_ids) > 10 then
    raise exception 'Too many services requested'
      using errcode = '22023';
  end if;


  if exists (
    select 1
    from unnest(p_service_ids) as service_id
    where service_id is null
  ) then
    raise exception 'Invalid service list'
      using errcode = '22023';
  end if;


  if (
    select count(*)
    from unnest(p_service_ids) as service_id
  ) <> (
    select count(distinct service_id)
    from unnest(p_service_ids) as service_id
  ) then
    raise exception 'Duplicate services are not allowed'
      using errcode = '22023';
  end if;


  -- -------------------------------------------------------
  -- Obtener barbería y configuración
  -- Solo una barbería PUBLICADA acepta nuevas citas.
  -- -------------------------------------------------------

  select
    barber.barbershop_id,
    settings.min_booking_notice_minutes,
    settings.max_booking_days,
    settings.slot_interval_minutes,
    settings.appointment_buffer_minutes
  into
    v_barbershop_id,
    v_min_notice,
    v_max_days,
    v_slot_interval,
    v_default_buffer
  from public.barbers as barber
  inner join public.barbershop_memberships as membership
    on membership.barbershop_id = barber.barbershop_id
   and membership.user_id = barber.user_id
  inner join public.barbershops as shop
    on shop.id = barber.barbershop_id
  inner join public.barbershop_settings as settings
    on settings.barbershop_id = barber.barbershop_id
  where barber.id = p_barber_id
    and barber.is_active = true
    and membership.status = 'active'
    and shop.status = 'published';

  if not found then
    raise exception 'Barber is not available for booking'
      using errcode = 'P0002';
  end if;


  -- -------------------------------------------------------
  -- Comprobar que el barbero realiza TODOS los servicios
  -- -------------------------------------------------------

  select
    count(*)::integer,
    coalesce(sum(service.duration_minutes), 0)::integer
  into
    v_service_count,
    v_current_duration
  from public.services as service
  inner join public.barber_services as assignment
    on assignment.service_id = service.id
   and assignment.barbershop_id = service.barbershop_id
   and assignment.barber_id = p_barber_id
  where service.id = any(p_service_ids)
    and service.barbershop_id = v_barbershop_id
    and (
      p_require_active_services = false
      or service.is_active = true
    );

  if v_service_count <> cardinality(p_service_ids) then
    raise exception 'Barber cannot perform all selected services'
      using errcode = '22023';
  end if;


  v_duration := coalesce(
    p_duration_minutes,
    v_current_duration
  );

  v_buffer := coalesce(
    p_buffer_minutes,
    v_default_buffer
  );


  if v_duration not between 1 and 4800 then
    raise exception 'Invalid appointment duration'
      using errcode = '22023';
  end if;

  if v_buffer not between 0 and 240 then
    raise exception 'Invalid appointment buffer'
      using errcode = '22023';
  end if;


  -- -------------------------------------------------------
  -- Validar horizonte de reserva usando horario de Perú
  -- -------------------------------------------------------

  v_today := (
    now() at time zone 'America/Lima'
  )::date;

  if p_date < v_today
     or p_date > (v_today + v_max_days) then
    return;
  end if;


  -- -------------------------------------------------------
  -- Generar horarios posibles
  -- -------------------------------------------------------

  return query

  select
    slot.slot_start,
    slot.slot_start
      + make_interval(mins => v_duration)

  from public.barber_schedules as schedule

  cross join lateral generate_series(
    (
      p_date + schedule.start_time
    ) at time zone 'America/Lima',

    (
      (
        p_date + schedule.end_time
      ) at time zone 'America/Lima'
    )
      - make_interval(mins => v_duration),

    make_interval(mins => v_slot_interval)
  ) as slot(slot_start)

  where schedule.barber_id = p_barber_id
    and schedule.barbershop_id = v_barbershop_id

    and schedule.weekday =
      extract(dow from p_date)::smallint


    -- Mínimo 1 hora por defecto, o lo configurado.
    and slot.slot_start >=
      now() + make_interval(mins => v_min_notice)


    -- No puede cruzar cierres de toda la barbería.
    and not exists (
      select 1
      from public.barbershop_closures as closure
      where closure.barbershop_id = v_barbershop_id
        and tstzrange(
          slot.slot_start,
          slot.slot_start
            + make_interval(mins => v_duration),
          '[)'
        ) && tstzrange(
          closure.starts_at,
          closure.ends_at,
          '[)'
        )
    )


    -- No puede cruzar un bloqueo personal del barbero.
    and not exists (
      select 1
      from public.barber_blocks as block
      where block.barber_id = p_barber_id
        and block.barbershop_id = v_barbershop_id
        and tstzrange(
          slot.slot_start,
          slot.slot_start
            + make_interval(mins => v_duration),
          '[)'
        ) && tstzrange(
          block.starts_at,
          block.ends_at,
          '[)'
        )
    )


    -- No puede cruzar otra reserva activa.
    -- Aquí sí consideramos también el margen entre citas.
    and not exists (
      select 1
      from public.reservations as reservation
      where reservation.barber_id = p_barber_id
        and reservation.barbershop_id = v_barbershop_id

        and reservation.status in (
          'confirmed',
          'in_progress'
        )

        and (
          p_exclude_reservation_id is null
          or reservation.id <> p_exclude_reservation_id
        )

        and tstzrange(
          slot.slot_start,
          slot.slot_start
            + make_interval(
                mins => v_duration + v_buffer
              ),
          '[)'
        ) && tstzrange(
          reservation.starts_at,
          reservation.occupied_until,
          '[)'
        )
    )

  order by slot.slot_start;
end;
$$;


revoke execute
on function private.get_available_slots_impl(
  uuid,
  uuid[],
  date,
  integer,
  integer,
  boolean,
  uuid
)
from public, anon;


-- =========================================================
-- RPC PÚBLICA DE DISPONIBILIDAD
-- =========================================================

create or replace function public.get_available_slots(
  p_barber_id uuid,
  p_service_ids uuid[],
  p_date date
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from private.get_available_slots_impl(
    p_barber_id,
    p_service_ids,
    p_date,
    null,
    null,
    true,
    null
  );
$$;


revoke execute
on function public.get_available_slots(
  uuid,
  uuid[],
  date
)
from public, anon;


grant execute
on function public.get_available_slots(
  uuid,
  uuid[],
  date
)
to authenticated;


-- =========================================================
-- CREAR RESERVA
--
-- p_items ejemplo:
--
-- [
--   {
--     "service_id": "uuid",
--     "style_id": "uuid-opcional"
--   },
--   {
--     "service_id": "uuid",
--     "style_id": null
--   }
-- ]
-- =========================================================

create or replace function private.create_reservation_impl(
  p_barber_id uuid,
  p_items jsonb,
  p_starts_at timestamptz,
  p_payment_method public.payment_method
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_client_id uuid;

  v_barbershop_id uuid;
  v_barber_user_id uuid;

  v_service_ids uuid[];

  v_service_count integer;
  v_total_price numeric(10, 2);
  v_total_duration integer;
  v_buffer integer;

  v_ends_at timestamptz;
  v_occupied_until timestamptz;

  v_reservation_id uuid;
  v_payment_id uuid;

  v_booking_date date;
begin
  v_client_id := (select auth.uid());

  if v_client_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- -------------------------------------------------------
  -- Validar JSON
  -- -------------------------------------------------------

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one service is required'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 10
     or pg_column_size(p_items) > 32768 then
    raise exception 'Reservation services payload is too large'
      using errcode = '22023';
  end if;


  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)
    where jsonb_typeof(item.value) <> 'object'
       or not (item.value ? 'service_id')
       or jsonb_typeof(item.value -> 'service_id') <> 'string'
       or nullif(trim(item.value ->> 'service_id'), '') is null
       or (item.value - 'service_id' - 'style_id') <> '{}'::jsonb
       or (
         item.value ? 'style_id'
         and item.value -> 'style_id' <> 'null'::jsonb
         and jsonb_typeof(item.value -> 'style_id') <> 'string'
       )
  ) then
    raise exception 'Invalid reservation services'
      using errcode = '22023';
  end if;


  select array_agg(
    (item.value ->> 'service_id')::uuid
    order by item.ordinality
  )
  into v_service_ids
  from jsonb_array_elements(p_items)
    with ordinality as item(value, ordinality);


  if exists (
    select 1
    from unnest(v_service_ids) as service_id
    where service_id is null
  ) then
    raise exception 'Invalid service identifier'
      using errcode = '22023';
  end if;


  if (
    select count(*)
    from unnest(v_service_ids) as service_id
  ) <> (
    select count(distinct service_id)
    from unnest(v_service_ids) as service_id
  ) then
    raise exception 'Duplicate services are not allowed'
      using errcode = '22023';
  end if;


  -- -------------------------------------------------------
  -- Bloquear perfil del cliente.
  --
  -- Esto serializa reservas simultáneas del mismo cliente
  -- y protege el límite de máximo 2 reservas futuras.
  -- -------------------------------------------------------

  perform 1
  from public.profiles
  where id = v_client_id
  for update;

  if not found then
    raise exception 'User profile not found'
      using errcode = 'P0002';
  end if;


  if (
    select count(*)
    from public.reservations as reservation
    where reservation.client_id = v_client_id
      and reservation.status in (
        'confirmed',
        'in_progress'
      )
      and reservation.starts_at >= now()
  ) >= 2 then
    raise exception
      'Maximum of two active future reservations reached'
      using errcode = '23514';
  end if;


  -- -------------------------------------------------------
  -- Obtener y bloquear barbero
  -- -------------------------------------------------------

  select
    barber.barbershop_id,
    barber.user_id
  into
    v_barbershop_id,
    v_barber_user_id
  from public.barbers as barber
  inner join public.barbershop_memberships as membership
    on membership.barbershop_id = barber.barbershop_id
   and membership.user_id = barber.user_id
  where barber.id = p_barber_id
    and barber.is_active = true
    and membership.status = 'active'
  for update of barber;

  if not found then
    raise exception 'Barber is not available'
      using errcode = 'P0002';
  end if;


  -- -------------------------------------------------------
  -- Obtener precio y duración REALES desde la BD
  -- -------------------------------------------------------

  select
    count(*)::integer,
    coalesce(sum(service.price), 0)::numeric(10, 2),
    coalesce(sum(service.duration_minutes), 0)::integer
  into
    v_service_count,
    v_total_price,
    v_total_duration
  from public.services as service
  inner join public.barber_services as assignment
    on assignment.service_id = service.id
   and assignment.barbershop_id = service.barbershop_id
   and assignment.barber_id = p_barber_id
  where service.id = any(v_service_ids)
    and service.barbershop_id = v_barbershop_id
    and service.is_active = true;

  if v_service_count <> cardinality(v_service_ids) then
    raise exception
      'Barber cannot perform all selected active services'
      using errcode = '22023';
  end if;


  -- -------------------------------------------------------
  -- Validar estilos
  -- -------------------------------------------------------

  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)

    where nullif(
      item.value ->> 'style_id',
      ''
    ) is not null

    and not exists (
      select 1
      from public.styles as style
      where style.id =
        (item.value ->> 'style_id')::uuid

        and style.service_id =
          (item.value ->> 'service_id')::uuid

        and style.is_active = true
    )
  ) then
    raise exception
      'Invalid or inactive style for selected service'
      using errcode = '22023';
  end if;


  select settings.appointment_buffer_minutes
  into v_buffer
  from public.barbershop_settings as settings
  where settings.barbershop_id = v_barbershop_id;

  if not found then
    raise exception 'Barbershop settings not found'
      using errcode = 'P0002';
  end if;


  -- -------------------------------------------------------
  -- Validar que la hora realmente esté disponible
  -- -------------------------------------------------------

  v_booking_date := (
    p_starts_at at time zone 'America/Lima'
  )::date;


  if not exists (
    select 1
    from private.get_available_slots_impl(
      p_barber_id,
      v_service_ids,
      v_booking_date,
      v_total_duration,
      v_buffer,
      true,
      null
    ) as slot
    where slot.starts_at = p_starts_at
  ) then
    raise exception 'Selected time is not available'
      using errcode = '23P01';
  end if;


  v_ends_at :=
    p_starts_at
    + make_interval(mins => v_total_duration);

  v_occupied_until :=
    v_ends_at
    + make_interval(mins => v_buffer);


  -- -------------------------------------------------------
  -- Crear reserva
  -- -------------------------------------------------------

  insert into public.reservations (
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
    v_barbershop_id,
    v_client_id,
    p_barber_id,

    p_starts_at,
    v_ends_at,
    v_occupied_until,

    'confirmed',

    v_total_price,
    v_total_duration,
    v_buffer
  )
  returning id into v_reservation_id;


  -- -------------------------------------------------------
  -- Snapshot de cada servicio
  -- -------------------------------------------------------

  insert into public.reservation_services (
    reservation_id,
    barbershop_id,
    service_id,
    style_id,
    price_at_booking,
    duration_at_booking
  )
  select
    v_reservation_id,
    v_barbershop_id,
    service.id,

    case
      when nullif(
        item.value ->> 'style_id',
        ''
      ) is null
        then null
      else
        (item.value ->> 'style_id')::uuid
    end,

    service.price,
    service.duration_minutes

  from jsonb_array_elements(p_items) as item(value)

  inner join public.services as service
    on service.id =
      (item.value ->> 'service_id')::uuid;


  -- -------------------------------------------------------
  -- Crear pago PENDIENTE
  -- -------------------------------------------------------

  insert into public.payments (
    reservation_id,
    barbershop_id,
    method,
    status,
    amount
  )
  values (
    v_reservation_id,
    v_barbershop_id,
    p_payment_method,
    'pending',
    v_total_price
  )
  returning id into v_payment_id;


  -- -------------------------------------------------------
  -- Notificación para cliente
  -- -------------------------------------------------------

  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id
  )
  values (
    v_client_id,
    v_barbershop_id,
    'reservation_created',
    'Reserva confirmada',
    'Tu reserva fue creada correctamente.',
    v_reservation_id
  );


  -- -------------------------------------------------------
  -- Notificación para barbero
  -- -------------------------------------------------------

  if v_barber_user_id <> v_client_id then
    insert into public.notifications (
      user_id,
      barbershop_id,
      type,
      title,
      message,
      reservation_id
    )
    values (
      v_barber_user_id,
      v_barbershop_id,
      'reservation_created',
      'Nueva reserva',
      'Tienes una nueva reserva asignada.',
      v_reservation_id
    );
  end if;


  -- -------------------------------------------------------
  -- Notificar administradores
  -- Evitamos duplicar al cliente/barbero.
  -- -------------------------------------------------------

  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id
  )
  select
    membership.user_id,
    v_barbershop_id,
    'reservation_created',
    'Nueva reserva',
    'Se registró una nueva reserva en la barbería.',
    v_reservation_id

  from public.barbershop_memberships as membership

  where membership.barbershop_id = v_barbershop_id
    and membership.role = 'administrator'
    and membership.status = 'active'

    and membership.user_id <> v_client_id
    and membership.user_id <> v_barber_user_id;


  -- -------------------------------------------------------
  -- Yape pendiente: avisar a TODOS los administradores
  -- -------------------------------------------------------

  if p_payment_method = 'yape' then

    insert into public.notifications (
      user_id,
      barbershop_id,
      type,
      title,
      message,
      reservation_id,
      payment_id
    )
    select
      membership.user_id,
      v_barbershop_id,
      'yape_payment_pending',
      'Pago Yape pendiente',
      'Existe un pago por Yape pendiente de confirmación.',
      v_reservation_id,
      v_payment_id

    from public.barbershop_memberships as membership

    where membership.barbershop_id = v_barbershop_id
      and membership.role = 'administrator'
      and membership.status = 'active';

  end if;


  return v_reservation_id;
end;
$$;


create or replace function public.create_reservation(
  p_barber_id uuid,
  p_items jsonb,
  p_starts_at timestamptz,
  p_payment_method public.payment_method
)
returns uuid
language sql
volatile
security definer
set search_path = ''
as $$
  select private.create_reservation_impl(
    p_barber_id,
    p_items,
    p_starts_at,
    p_payment_method
  );
$$;


revoke execute
on function private.create_reservation_impl(
  uuid,
  jsonb,
  timestamptz,
  public.payment_method
)
from public, anon;


revoke execute
on function public.create_reservation(
  uuid,
  jsonb,
  timestamptz,
  public.payment_method
)
from public, anon;


grant execute
on function public.create_reservation(
  uuid,
  jsonb,
  timestamptz,
  public.payment_method
)
to authenticated;


-- =========================================================
-- REPROGRAMAR RESERVA
--
-- Máximo 1 vez.
-- Puede cambiar:
--   fecha
--   hora
--   barbero
--
-- Mantiene:
--   servicios
--   precios históricos
--   duración histórica
-- =========================================================

create or replace function private.reschedule_reservation_impl(
  p_reservation_id uuid,
  p_new_barber_id uuid,
  p_new_starts_at timestamptz
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;

  v_reservation public.reservations%rowtype;

  v_service_ids uuid[];

  v_new_barber_user_id uuid;
  v_old_barber_user_id uuid;

  v_settings public.barbershop_settings%rowtype;

  v_is_client boolean;
  v_is_late boolean;

  v_new_ends_at timestamptz;
  v_new_occupied_until timestamptz;

  v_booking_date date;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;


  v_is_client :=
    v_reservation.client_id = v_user_id;


  if not (
    v_is_client
    or private.is_barbershop_admin(
      v_reservation.barbershop_id
    )
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;


  if v_reservation.status <> 'confirmed' then
    raise exception
      'Only confirmed reservations can be rescheduled'
      using errcode = '22023';
  end if;


  if v_reservation.starts_at <= now() then
    raise exception 'Reservation has already started'
      using errcode = '22023';
  end if;


  if v_reservation.reschedule_count >= 1 then
    raise exception
      'Reservation has already been rescheduled once'
      using errcode = '23514';
  end if;


  if p_new_barber_id = v_reservation.barber_id
     and p_new_starts_at = v_reservation.starts_at then
    raise exception 'No scheduling changes were provided'
      using errcode = '22023';
  end if;


  -- Serializa siempre ambos barberos en orden estable.
  perform 1
  from public.barbers as barber
  where barber.id in (
    v_reservation.barber_id,
    p_new_barber_id
  )
  order by barber.id
  for update;


  -- -------------------------------------------------------
  -- El nuevo barbero debe pertenecer a la misma barbería.
  -- -------------------------------------------------------

  select barber.user_id
  into v_new_barber_user_id
  from public.barbers as barber
  inner join public.barbershop_memberships as membership
    on membership.barbershop_id = barber.barbershop_id
   and membership.user_id = barber.user_id
  where barber.id = p_new_barber_id
    and barber.barbershop_id =
      v_reservation.barbershop_id
    and barber.is_active = true
    and membership.status = 'active';

  if not found then
    raise exception 'New barber is not available'
      using errcode = 'P0002';
  end if;


  select barber.user_id
  into v_old_barber_user_id
  from public.barbers as barber
  where barber.id = v_reservation.barber_id;


  select array_agg(
    service.service_id
    order by service.service_id
  )
  into v_service_ids
  from public.reservation_services as service
  where service.reservation_id = p_reservation_id;


  if v_service_ids is null then
    raise exception 'Reservation has no services'
      using errcode = '23514';
  end if;


  select *
  into v_settings
  from public.barbershop_settings
  where barbershop_id =
    v_reservation.barbershop_id;

  if not found then
    raise exception 'Barbershop settings not found'
      using errcode = 'P0002';
  end if;


  v_booking_date := (
    p_new_starts_at at time zone 'America/Lima'
  )::date;


  -- -------------------------------------------------------
  -- Aquí usamos los snapshots originales:
  -- duración y buffer NO cambian.
  --
  -- Los servicios pueden estar inactivos porque esta es
  -- una reserva ya existente, pero el nuevo barbero todavía
  -- debe tenerlos asignados.
  -- -------------------------------------------------------

  if not exists (
    select 1
    from private.get_available_slots_impl(
      p_new_barber_id,
      v_service_ids,
      v_booking_date,
      v_reservation.total_duration_minutes,
      v_reservation.buffer_minutes_at_booking,
      false,
      p_reservation_id
    ) as slot
    where slot.starts_at = p_new_starts_at
  ) then
    raise exception 'New time is not available'
      using errcode = '23P01';
  end if;


  v_new_ends_at :=
    p_new_starts_at
    + make_interval(
        mins => v_reservation.total_duration_minutes
      );

  v_new_occupied_until :=
    v_new_ends_at
    + make_interval(
        mins => v_reservation.buffer_minutes_at_booking
      );


  -- -------------------------------------------------------
  -- Reprogramación tardía:
  -- solo se marca cuando quien reprograma es el CLIENTE.
  -- -------------------------------------------------------

  v_is_late :=
    v_is_client
    and (
      v_reservation.starts_at
      <
      now()
      + make_interval(
          mins => v_settings.cancellation_notice_minutes
        )
    );


  update public.reservations
  set
    previous_starts_at = starts_at,
    previous_barber_id = barber_id,

    barber_id = p_new_barber_id,
    starts_at = p_new_starts_at,
    ends_at = v_new_ends_at,
    occupied_until = v_new_occupied_until,

    reschedule_count = 1,
    rescheduled_at = now(),
    is_late_reschedule = v_is_late,
    refund_policy_at_late_action = case
      when v_is_late
       and refund_policy_at_late_action is null
        then v_settings.late_cancellation_refund_policy
      else refund_policy_at_late_action
    end,
    is_refund_eligible = case
      when v_is_late
       and refund_policy_at_late_action is null
        then v_settings.late_cancellation_refund_policy =
          'full_refund'
      else is_refund_eligible
    end

  where id = p_reservation_id;


  -- Cliente
  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id
  )
  values (
    v_reservation.client_id,
    v_reservation.barbershop_id,
    'reservation_rescheduled',
    'Reserva reprogramada',
    'La fecha u hora de tu reserva fue actualizada.',
    p_reservation_id
  );


  -- Barbero anterior, si cambió.
  if v_reservation.barber_id <> p_new_barber_id then

    if v_old_barber_user_id <> v_user_id then
      insert into public.notifications (
        user_id,
        barbershop_id,
        type,
        title,
        message,
        reservation_id
      )
      values (
        v_old_barber_user_id,
        v_reservation.barbershop_id,
        'reservation_rescheduled',
        'Reserva reprogramada',
        'Una reserva fue retirada de tu horario.',
        p_reservation_id
      );
    end if;

  end if;


  -- Nuevo barbero
  if v_new_barber_user_id <> v_user_id
     and v_new_barber_user_id <>
       v_reservation.client_id then

    insert into public.notifications (
      user_id,
      barbershop_id,
      type,
      title,
      message,
      reservation_id
    )
    values (
      v_new_barber_user_id,
      v_reservation.barbershop_id,
      'reservation_rescheduled',
      'Reserva reprogramada',
      'Tienes una reserva asignada en un nuevo horario.',
      p_reservation_id
    );

  end if;


  -- Administradores
  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id
  )
  select
    membership.user_id,
    v_reservation.barbershop_id,
    'reservation_rescheduled',
    'Reserva reprogramada',
    'Una reserva de la barbería fue reprogramada.',
    p_reservation_id

  from public.barbershop_memberships as membership

  where membership.barbershop_id =
      v_reservation.barbershop_id
    and membership.role = 'administrator'
    and membership.status = 'active'

    and membership.user_id <> v_user_id
    and membership.user_id <>
      v_new_barber_user_id;

end;
$$;


create or replace function public.reschedule_reservation(
  p_reservation_id uuid,
  p_new_barber_id uuid,
  p_new_starts_at timestamptz
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.reschedule_reservation_impl(
    p_reservation_id,
    p_new_barber_id,
    p_new_starts_at
  );
$$;


revoke execute
on function private.reschedule_reservation_impl(
  uuid,
  uuid,
  timestamptz
)
from public, anon;


revoke execute
on function public.reschedule_reservation(
  uuid,
  uuid,
  timestamptz
)
from public, anon;


grant execute
on function public.reschedule_reservation(
  uuid,
  uuid,
  timestamptz
)
to authenticated;


-- =========================================================
-- CANCELAR RESERVA
-- =========================================================

create or replace function private.cancel_reservation_impl(
  p_reservation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;

  v_reservation public.reservations%rowtype;
  v_settings public.barbershop_settings%rowtype;
  v_payment public.payments%rowtype;

  v_barber_user_id uuid;

  v_is_client boolean;
  v_is_late boolean;

  v_effective_refund_eligible boolean;
  v_refund_required boolean := false;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;


  v_is_client :=
    v_reservation.client_id = v_user_id;


  if not (
    v_is_client
    or private.is_barbershop_admin(
      v_reservation.barbershop_id
    )
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;


  if v_reservation.status <> 'confirmed' then
    raise exception
      'Only confirmed reservations can be cancelled'
      using errcode = '22023';
  end if;


  if v_reservation.starts_at <= now() then
    raise exception
      'Reservation can no longer be cancelled'
      using errcode = '22023';
  end if;


  -- Orden financiero común: primero reserva, después pago.
  select *
  into v_payment
  from public.payments
  where reservation_id = p_reservation_id
  for update;

  if not found then
    raise exception 'Payment not found'
      using errcode = 'P0002';
  end if;


  select *
  into v_settings
  from public.barbershop_settings
  where barbershop_id =
    v_reservation.barbershop_id;

  if not found then
    raise exception 'Barbershop settings not found'
      using errcode = 'P0002';
  end if;


  -- Cancelación tardía solo aplica al CLIENTE.
  v_is_late :=
    v_is_client
    and (
      v_reservation.starts_at
      <
      now()
      + make_interval(
          mins => v_settings.cancellation_notice_minutes
        )
    );

  v_effective_refund_eligible := case
    when v_reservation.refund_policy_at_late_action is not null
      then v_reservation.is_refund_eligible
    when v_is_late
      then v_settings.late_cancellation_refund_policy =
        'full_refund'
    else true
  end;


  update public.reservations
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = v_user_id,
    is_late_cancellation = v_is_late,
    refund_policy_at_late_action = case
      when v_is_late
       and refund_policy_at_late_action is null
        then v_settings.late_cancellation_refund_policy
      else refund_policy_at_late_action
    end,
    is_refund_eligible = v_effective_refund_eligible
  where id = p_reservation_id;


  select barber.user_id
  into v_barber_user_id
  from public.barbers as barber
  where barber.id = v_reservation.barber_id;


  -- -------------------------------------------------------
  -- Determinar si corresponde reembolso.
  --
  -- No cambiamos el pago automáticamente a REFUNDED:
  -- el reembolso sigue siendo manual.
  -- -------------------------------------------------------

  v_refund_required :=
    v_payment.status = 'paid'
    and v_effective_refund_eligible;


  -- Cliente
  if v_reservation.client_id <> v_user_id then

    insert into public.notifications (
      user_id,
      barbershop_id,
      type,
      title,
      message,
      reservation_id
    )
    values (
      v_reservation.client_id,
      v_reservation.barbershop_id,
      'reservation_cancelled',
      'Reserva cancelada',
      'Tu reserva fue cancelada.',
      p_reservation_id
    );

  end if;


  -- Barbero
  if v_barber_user_id <> v_user_id
     and v_barber_user_id <>
       v_reservation.client_id then

    insert into public.notifications (
      user_id,
      barbershop_id,
      type,
      title,
      message,
      reservation_id
    )
    values (
      v_barber_user_id,
      v_reservation.barbershop_id,
      'reservation_cancelled',
      'Reserva cancelada',
      'Una reserva de tu agenda fue cancelada.',
      p_reservation_id
    );

  end if;


  -- Administradores
  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id
  )
  select
    membership.user_id,
    v_reservation.barbershop_id,
    'reservation_cancelled',
    'Reserva cancelada',
    'Una reserva de la barbería fue cancelada.',
    p_reservation_id

  from public.barbershop_memberships as membership

  where membership.barbershop_id =
      v_reservation.barbershop_id
    and membership.role = 'administrator'
    and membership.status = 'active'

    and membership.user_id <> v_user_id
    and membership.user_id <> v_barber_user_id;


  -- -------------------------------------------------------
  -- Si existe dinero por devolver, avisar al administrador.
  -- -------------------------------------------------------

  if v_refund_required then

    insert into public.notifications (
      user_id,
      barbershop_id,
      type,
      title,
      message,
      reservation_id
    )
    select
      membership.user_id,
      v_reservation.barbershop_id,
      'refund_required',
      'Reembolso pendiente',
      'Una reserva cancelada requiere un reembolso manual.',
      p_reservation_id

    from public.barbershop_memberships as membership

    where membership.barbershop_id =
        v_reservation.barbershop_id
      and membership.role = 'administrator'
      and membership.status = 'active';

  end if;

end;
$$;


create or replace function public.cancel_reservation(
  p_reservation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.cancel_reservation_impl(
    p_reservation_id
  );
$$;


revoke execute
on function private.cancel_reservation_impl(uuid)
from public, anon;


revoke execute
on function public.cancel_reservation(uuid)
from public, anon;


grant execute
on function public.cancel_reservation(uuid)
to authenticated;


-- =========================================================
-- TRAZABILIDAD DE ATENCIÓN
-- =========================================================

alter table public.reservations
  add column started_at timestamptz,
  add column completed_at timestamptz;


alter table public.reservations
  add constraint reservations_status_data_check
  check (
    (
      status = 'confirmed'
      and started_at is null
      and completed_at is null
      and cancelled_at is null
      and cancelled_by is null
      and no_show_at is null
    )
    or
    (
      status = 'in_progress'
      and started_at is not null
      and completed_at is null
      and cancelled_at is null
      and cancelled_by is null
      and no_show_at is null
    )
    or
    (
      status = 'completed'
      and started_at is not null
      and completed_at is not null
      and cancelled_at is null
      and cancelled_by is null
      and no_show_at is null
    )
    or
    (
      status = 'cancelled'
      and started_at is null
      and completed_at is null
      and cancelled_at is not null
      and cancelled_by is not null
      and no_show_at is null
    )
    or
    (
      status = 'no_show'
      and started_at is null
      and completed_at is null
      and cancelled_at is null
      and cancelled_by is null
      and no_show_at is not null
    )
  );


-- =========================================================
-- INICIAR ATENCIÓN
--
-- Puede hacerlo:
--   - barbero asignado
--   - administrador de esa barbería
-- =========================================================

create or replace function private.start_reservation_impl(
  p_reservation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if not (
    private.is_own_barber(v_reservation.barber_id)
    or private.is_barbershop_admin(
      v_reservation.barbershop_id
    )
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  if v_reservation.status <> 'confirmed' then
    raise exception
      'Only confirmed reservations can be started'
      using errcode = '22023';
  end if;

  update public.reservations
  set
    status = 'in_progress',
    started_at = now()
  where id = p_reservation_id;
end;
$$;


create or replace function public.start_reservation(
  p_reservation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.start_reservation_impl(
    p_reservation_id
  );
$$;


-- =========================================================
-- COMPLETAR ATENCIÓN
--
-- Flujo:
-- CONFIRMED -> IN_PROGRESS -> COMPLETED
-- =========================================================

create or replace function private.complete_reservation_impl(
  p_reservation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if not (
    private.is_own_barber(v_reservation.barber_id)
    or private.is_barbershop_admin(
      v_reservation.barbershop_id
    )
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  if v_reservation.status <> 'in_progress' then
    raise exception
      'Only reservations in progress can be completed'
      using errcode = '22023';
  end if;

  update public.reservations
  set
    status = 'completed',
    completed_at = now()
  where id = p_reservation_id;
end;
$$;


create or replace function public.complete_reservation(
  p_reservation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.complete_reservation_impl(
    p_reservation_id
  );
$$;


-- =========================================================
-- MARCAR NO ASISTIÓ
--
-- Tolerancia definida para V1: 10 minutos.
-- =========================================================

create or replace function private.mark_no_show_impl(
  p_reservation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if not (
    private.is_own_barber(v_reservation.barber_id)
    or private.is_barbershop_admin(
      v_reservation.barbershop_id
    )
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  if v_reservation.status <> 'confirmed' then
    raise exception
      'Only confirmed reservations can be marked as no-show'
      using errcode = '22023';
  end if;

  if now() < v_reservation.starts_at + interval '10 minutes' then
    raise exception
      'The 10-minute tolerance period has not ended'
      using errcode = '22023';
  end if;

  update public.reservations
  set
    status = 'no_show',
    no_show_at = now()
  where id = p_reservation_id;
end;
$$;


create or replace function public.mark_no_show(
  p_reservation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.mark_no_show_impl(
    p_reservation_id
  );
$$;


-- =========================================================
-- CAMBIAR MÉTODO DE PAGO
--
-- Solo el CLIENTE propietario.
-- Solo mientras siga PENDIENTE.
-- =========================================================

create or replace function private.change_payment_method_impl(
  p_reservation_id uuid,
  p_method public.payment_method
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_reservation public.reservations%rowtype;
  v_payment public.payments%rowtype;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if v_reservation.client_id <> v_user_id then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  if v_reservation.status = 'cancelled' then
    raise exception
      'Payment method cannot be changed for a cancelled reservation'
      using errcode = '22023';
  end if;

  select *
  into v_payment
  from public.payments
  where reservation_id = p_reservation_id
  for update;

  if not found then
    raise exception 'Payment not found'
      using errcode = 'P0002';
  end if;

  if v_payment.status <> 'pending' then
    raise exception
      'Payment method can only be changed while payment is pending'
      using errcode = '22023';
  end if;

  update public.payments
  set method = p_method
  where id = v_payment.id;
end;
$$;


create or replace function public.change_payment_method(
  p_reservation_id uuid,
  p_method public.payment_method
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.change_payment_method_impl(
    p_reservation_id,
    p_method
  );
$$;


-- =========================================================
-- CONFIRMAR PAGO EN EFECTIVO
--
-- Puede hacerlo:
--   - barbero asignado
--   - administrador
-- =========================================================

create or replace function private.confirm_cash_payment_impl(
  p_reservation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_reservation public.reservations%rowtype;
  v_payment public.payments%rowtype;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if not (
    private.is_own_barber(v_reservation.barber_id)
    or private.is_barbershop_admin(
      v_reservation.barbershop_id
    )
  ) then
    raise exception 'Permission denied'
      using errcode = '42501';
  end if;

  if v_reservation.status not in (
    'confirmed',
    'in_progress',
    'completed'
  ) then
    raise exception
      'Payment cannot be confirmed for this reservation'
      using errcode = '22023';
  end if;

  select *
  into v_payment
  from public.payments
  where reservation_id = p_reservation_id
  for update;

  if not found then
    raise exception 'Payment not found'
      using errcode = 'P0002';
  end if;

  if v_payment.method <> 'cash' then
    raise exception 'Payment method is not cash'
      using errcode = '22023';
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'Payment is not pending'
      using errcode = '22023';
  end if;

  update public.payments
  set
    status = 'paid',
    confirmed_by = v_user_id,
    confirmed_at = now()
  where id = v_payment.id;

  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id,
    payment_id
  )
  values (
    v_reservation.client_id,
    v_reservation.barbershop_id,
    'payment_confirmed',
    'Pago confirmado',
    'Tu pago en efectivo fue confirmado.',
    p_reservation_id,
    v_payment.id
  );
end;
$$;


create or replace function public.confirm_cash_payment(
  p_reservation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.confirm_cash_payment_impl(
    p_reservation_id
  );
$$;


-- =========================================================
-- CONFIRMAR PAGO POR YAPE
--
-- ÚNICAMENTE ADMINISTRADOR.
-- =========================================================

create or replace function private.confirm_yape_payment_impl(
  p_reservation_id uuid,
  p_yape_reference text default null,
  p_payment_note text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_reservation public.reservations%rowtype;
  v_payment public.payments%rowtype;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if not private.is_barbershop_admin(
    v_reservation.barbershop_id
  ) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  if v_reservation.status not in (
    'confirmed',
    'in_progress',
    'completed'
  ) then
    raise exception
      'Payment cannot be confirmed for this reservation'
      using errcode = '22023';
  end if;

  select *
  into v_payment
  from public.payments
  where reservation_id = p_reservation_id
  for update;

  if not found then
    raise exception 'Payment not found'
      using errcode = 'P0002';
  end if;

  if v_payment.method <> 'yape' then
    raise exception 'Payment method is not Yape'
      using errcode = '22023';
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'Payment is not pending'
      using errcode = '22023';
  end if;

  update public.payments
  set
    status = 'paid',
    confirmed_by = v_user_id,
    confirmed_at = now(),
    yape_reference = nullif(
      trim(p_yape_reference),
      ''
    ),
    payment_note = nullif(
      trim(p_payment_note),
      ''
    )
  where id = v_payment.id;

  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id,
    payment_id
  )
  values (
    v_reservation.client_id,
    v_reservation.barbershop_id,
    'payment_confirmed',
    'Pago Yape confirmado',
    'Tu pago por Yape fue confirmado.',
    p_reservation_id,
    v_payment.id
  );
end;
$$;


create or replace function public.confirm_yape_payment(
  p_reservation_id uuid,
  p_yape_reference text default null,
  p_payment_note text default null
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.confirm_yape_payment_impl(
    p_reservation_id,
    p_yape_reference,
    p_payment_note
  );
$$;


-- =========================================================
-- REGISTRAR REEMBOLSO MANUAL
--
-- ÚNICAMENTE ADMINISTRADOR.
-- Solo para reservas CANCELADAS cuyo reembolso corresponda.
-- =========================================================

create or replace function private.refund_payment_impl(
  p_reservation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_reservation public.reservations%rowtype;
  v_payment public.payments%rowtype;
begin
  v_user_id := (select auth.uid());

  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found'
      using errcode = 'P0002';
  end if;

  if not private.is_barbershop_admin(
    v_reservation.barbershop_id
  ) then
    raise exception 'Administrator permission required'
      using errcode = '42501';
  end if;

  if v_reservation.status <> 'cancelled' then
    raise exception
      'Only cancelled reservations can be refunded'
      using errcode = '22023';
  end if;

  select *
  into v_payment
  from public.payments
  where reservation_id = p_reservation_id
  for update;

  if not found then
    raise exception 'Payment not found'
      using errcode = 'P0002';
  end if;

  if v_reservation.is_refund_eligible = false then
    raise exception
      'This reservation does not allow a refund'
      using errcode = '22023';
  end if;

  if v_payment.status <> 'paid' then
    raise exception
      'Only paid payments can be refunded'
      using errcode = '22023';
  end if;

  update public.payments
  set
    status = 'refunded',
    refunded_by = v_user_id,
    refunded_at = now()
  where id = v_payment.id;

  insert into public.notifications (
    user_id,
    barbershop_id,
    type,
    title,
    message,
    reservation_id,
    payment_id
  )
  values (
    v_reservation.client_id,
    v_reservation.barbershop_id,
    'payment_refunded',
    'Reembolso registrado',
    'El reembolso de tu reserva fue registrado.',
    p_reservation_id,
    v_payment.id
  );
end;
$$;


create or replace function public.refund_payment(
  p_reservation_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  select private.refund_payment_impl(
    p_reservation_id
  );
$$;


-- =========================================================
-- PERMISOS DE EJECUCIÓN
-- =========================================================

revoke execute
on function private.start_reservation_impl(uuid)
from public, anon;

revoke execute
on function private.complete_reservation_impl(uuid)
from public, anon;

revoke execute
on function private.mark_no_show_impl(uuid)
from public, anon;

revoke execute
on function private.change_payment_method_impl(
  uuid,
  public.payment_method
)
from public, anon;

revoke execute
on function private.confirm_cash_payment_impl(uuid)
from public, anon;

revoke execute
on function private.confirm_yape_payment_impl(
  uuid,
  text,
  text
)
from public, anon;

revoke execute
on function private.refund_payment_impl(uuid)
from public, anon;


revoke execute
on function public.start_reservation(uuid)
from public, anon;

revoke execute
on function public.complete_reservation(uuid)
from public, anon;

revoke execute
on function public.mark_no_show(uuid)
from public, anon;

revoke execute
on function public.change_payment_method(
  uuid,
  public.payment_method
)
from public, anon;

revoke execute
on function public.confirm_cash_payment(uuid)
from public, anon;

revoke execute
on function public.confirm_yape_payment(
  uuid,
  text,
  text
)
from public, anon;

revoke execute
on function public.refund_payment(uuid)
from public, anon;


grant execute
on function public.start_reservation(uuid)
to authenticated;

grant execute
on function public.complete_reservation(uuid)
to authenticated;

grant execute
on function public.mark_no_show(uuid)
to authenticated;

grant execute
on function public.change_payment_method(
  uuid,
  public.payment_method
)
to authenticated;

grant execute
on function public.confirm_cash_payment(uuid)
to authenticated;

grant execute
on function public.confirm_yape_payment(
  uuid,
  text,
  text
)
to authenticated;

grant execute
on function public.refund_payment(uuid)
to authenticated;


-- =========================================================
-- AUTORIDAD FINAL DE EJECUCIÓN
-- Las implementaciones y funciones de trigger privadas solo
-- pueden ser invocadas por funciones propietarias o triggers.
-- RLS conserva únicamente los helpers mínimos que necesita.
-- =========================================================

revoke execute on all functions in schema private
from public, anon, authenticated;

grant execute
on function private.is_barbershop_admin(uuid)
to authenticated;

grant execute
on function private.is_barbershop_member(uuid)
to authenticated;

grant execute
on function private.is_own_barber(uuid)
to authenticated;

grant execute
on function private.is_invitation_recipient(uuid)
to authenticated;

revoke execute
on function public.set_updated_at()
from public, anon, authenticated;

revoke execute
on function public.handle_new_user()
from public, anon, authenticated;

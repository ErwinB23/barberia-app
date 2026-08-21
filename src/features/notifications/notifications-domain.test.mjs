import assert from 'node:assert/strict';
import test from 'node:test';

const domain = await import('./notifications-domain.ts').catch(() => ({}));
const openFlow = await import('./notification-open-flow.ts').catch(() => ({}));

const notifications = [
  {
    id: 'older-unread',
    type: 'reservation_created',
    isRead: false,
    createdAt: '2026-08-12T10:00:00.000Z',
  },
  {
    id: 'newer-read',
    type: 'payment_confirmed',
    isRead: true,
    createdAt: '2026-08-13T10:00:00.000Z',
  },
];

test('mapea tipos existentes sin perder un fallback comprensible', () => {
  assert.equal(typeof domain.getNotificationTypeLabel, 'function');
  if (typeof domain.getNotificationTypeLabel !== 'function') return;

  assert.equal(domain.getNotificationTypeLabel('reservation_created'), 'Reserva');
  assert.equal(domain.getNotificationTypeLabel('yape_payment_pending'), 'Pago Yape');
  assert.equal(domain.getNotificationTypeLabel('payment_refunded'), 'Reembolso');
  assert.equal(domain.getNotificationTypeLabel('invitation_accepted'), 'Invitación aceptada');
  assert.equal(domain.getNotificationTypeLabel('invitation_rejected'), 'Invitación rechazada');
  assert.equal(domain.getNotificationTypeLabel('invitation_cancelled'), 'Invitación cancelada');
  assert.equal(domain.getNotificationTypeLabel('reservation_reminder'), 'Recordatorio');
  assert.equal(domain.getNotificationTypeLabel('future_event'), 'Actualización');
});

test('presenta contexto e iconografía semántica sin depender solo del color', () => {
  assert.equal(typeof domain.getNotificationPresentation, 'function');
  if (typeof domain.getNotificationPresentation !== 'function') return;

  assert.deepEqual(
    domain.getNotificationPresentation({
      type: 'reservation_created',
      invitationId: null,
      paymentId: null,
      reservationId,
    }),
    { kind: 'reservation', label: 'Reserva', contextLabel: 'Cita relacionada' },
  );
  assert.deepEqual(
    domain.getNotificationPresentation({
      type: 'invitation_received',
      invitationId: 'invitation-a',
      paymentId: null,
      reservationId: null,
    }),
    { kind: 'invitation', label: 'Invitación', contextLabel: 'Invitación de equipo' },
  );
  assert.deepEqual(
    domain.getNotificationPresentation({
      type: 'future_event',
      invitationId: null,
      paymentId: null,
      reservationId: null,
    }),
    { kind: 'general', label: 'Actualización', contextLabel: null },
  );
});

test('el estado vacío usa un mensaje positivo y una acción clara', () => {
  assert.deepEqual(domain.NOTIFICATIONS_EMPTY_STATE, {
    title: 'No tienes notificaciones nuevas',
    description: 'Cuando haya novedades sobre tus reservas o espacios, las encontrarás aquí.',
  });
});

test('cuenta no leídas y ordena las más recientes primero', () => {
  assert.equal(typeof domain.countUnreadNotifications, 'function');
  assert.equal(typeof domain.sortNotificationsNewestFirst, 'function');
  if (
    typeof domain.countUnreadNotifications !== 'function' ||
    typeof domain.sortNotificationsNewestFirst !== 'function'
  ) {
    return;
  }

  assert.equal(domain.countUnreadNotifications(notifications), 1);
  assert.deepEqual(
    domain.sortNotificationsNewestFirst(notifications).map((notification) => notification.id),
    ['newer-read', 'older-unread'],
  );
});

test('ofrece únicamente la acción de lectura opuesta al estado actual', () => {
  assert.equal(typeof domain.getNotificationReadActions, 'function');
  if (typeof domain.getNotificationReadActions !== 'function') return;

  assert.deepEqual(domain.getNotificationReadActions(false), {
    canMarkRead: true,
    canMarkUnread: false,
  });
  assert.deepEqual(domain.getNotificationReadActions(true), {
    canMarkRead: false,
    canMarkUnread: true,
  });
});

const reservationId = '11111111-1111-4111-8111-111111111111';
const barbershopId = '22222222-2222-4222-8222-222222222222';
const assignedBarberId = '33333333-3333-4333-8333-333333333333';

function reservationContexts(overrides = {}) {
  return new Map([
    [
      reservationId,
      {
        barbershopId,
        assignedBarberId,
        isClientOwner: false,
        isAdmin: false,
        ownActiveBarberId: null,
        ...overrides,
      },
    ],
  ]);
}

test('cliente abre únicamente el detalle de su propia reserva', () => {
  assert.equal(typeof domain.getNotificationHref, 'function');
  if (typeof domain.getNotificationHref !== 'function') return;

  assert.equal(
    domain.getNotificationHref(
      { type: 'reservation_created', invitationId: null, reservationId },
      reservationContexts({ isClientOwner: true }),
    ),
    `/reservations/${reservationId}`,
  );
  assert.equal(
    domain.getNotificationHref(
      { type: 'reservation_created', invitationId: null, reservationId },
      new Map(),
    ),
    null,
  );
});

test('barbero asignado abre la cita dentro de su propia agenda', () => {
  assert.equal(typeof domain.getNotificationHref, 'function');
  if (typeof domain.getNotificationHref !== 'function') return;

  assert.equal(
    domain.getNotificationHref(
      { type: 'reservation_rescheduled', invitationId: null, reservationId },
      reservationContexts({ ownActiveBarberId: assignedBarberId }),
    ),
    `/barbershops/${barbershopId}/barbers/${assignedBarberId}/appointments/${reservationId}`,
  );
  assert.equal(
    domain.getNotificationHref(
      { type: 'reservation_cancelled', invitationId: null, reservationId },
      reservationContexts({
        ownActiveBarberId: '44444444-4444-4444-8444-444444444444',
      }),
    ),
    null,
  );
});

test('administrador abre reservas y pagos en la agenda de su barbería', () => {
  assert.equal(typeof domain.getNotificationHref, 'function');
  if (typeof domain.getNotificationHref !== 'function') return;

  assert.equal(
    domain.getNotificationHref(
      { type: 'reservation_created', invitationId: null, reservationId },
      reservationContexts({ isAdmin: true }),
    ),
    `/barbershops/${barbershopId}/appointments/${reservationId}`,
  );
  assert.equal(
    domain.getNotificationHref(
      { type: 'yape_payment_pending', invitationId: null, reservationId },
      reservationContexts({ isAdmin: true }),
    ),
    `/barbershops/${barbershopId}/appointments/${reservationId}`,
  );
});

test('invitaciones conservan su destino actual', () => {
  assert.equal(typeof domain.getNotificationHref, 'function');
  if (typeof domain.getNotificationHref !== 'function') return;

  assert.equal(
    domain.getNotificationHref(
      { type: 'invitation_received', invitationId: 'invitation-a', reservationId: null },
      new Map(),
    ),
    '/invitations',
  );
});

test('notificación sin evento y acceso válidos no navega', () => {
  assert.equal(typeof domain.getNotificationHref, 'function');
  if (typeof domain.getNotificationHref !== 'function') return;

  assert.equal(
    domain.getNotificationHref(
      { type: 'future_event', invitationId: null, reservationId },
      reservationContexts({ isClientOwner: true, isAdmin: true }),
    ),
    null,
  );
  assert.equal(
    domain.getNotificationHref(
      { type: 'reservation_created', invitationId: null, reservationId: 'not-a-uuid' },
      new Map(),
    ),
    null,
  );
});

test('oculta optimistamente la notificación descartada y actualiza el contador', () => {
  assert.equal(typeof domain.excludeNotificationsById, 'function');
  if (typeof domain.excludeNotificationsById !== 'function') return;

  const visibleNotifications = domain.excludeNotificationsById(
    [
      { id: 'notification-a', isRead: false },
      { id: 'notification-b', isRead: true },
    ],
    new Set(['notification-a']),
  );

  assert.deepEqual(
    visibleNotifications.map((notification) => notification.id),
    ['notification-b'],
  );
  assert.equal(domain.countUnreadNotifications(visibleNotifications), 0);
});

test('abrir una notificación nueva actualiza su estado, contador y destino contextual', async () => {
  const destination = `/reservations/${reservationId}`;
  let localNotifications = [
    {
      id: 'notification-new',
      isRead: false,
      readAt: null,
      createdAt: '2026-08-18T10:00:00.000Z',
    },
  ];
  const events = [];

  const result = await openFlow.openNotificationDetail({
    notification: { id: 'notification-new', href: destination, isRead: false },
    markRead: async () => {
      events.push('mark-read');
    },
    navigate: (href) => {
      events.push(`navigate:${href}`);
    },
    onReadError: () => {
      events.push('read-error');
    },
    setLocalReadState: (isRead) => {
      localNotifications = openFlow.setNotificationReadStateLocally(
        localNotifications,
        'notification-new',
        isRead,
        '2026-08-18T10:05:00.000Z',
      );
      events.push(`local:${isRead}`);
    },
  });

  assert.equal(result, 'marked-read');
  assert.deepEqual(events, ['local:true', 'mark-read', `navigate:${destination}`]);
  assert.equal(localNotifications[0].isRead, true);
  assert.equal(domain.countUnreadNotifications(localNotifications), 0);
});

test('abrir una notificación ya leída navega sin repetir el update', async () => {
  const calls = [];

  const result = await openFlow.openNotificationDetail({
    notification: { id: 'notification-read', href: '/invitations', isRead: true },
    markRead: async () => {
      calls.push('mark-read');
    },
    navigate: (href) => {
      calls.push(`navigate:${href}`);
    },
    onReadError: () => {
      calls.push('read-error');
    },
    setLocalReadState: (isRead) => {
      calls.push(`local:${isRead}`);
    },
  });

  assert.equal(result, 'already-read');
  assert.deepEqual(calls, ['navigate:/invitations']);
});

test('marcar como no leída vuelve a contarla y abrirla la marca nuevamente', async () => {
  let localNotifications = [
    {
      id: 'notification-toggle',
      isRead: true,
      readAt: '2026-08-18T10:00:00.000Z',
      createdAt: '2026-08-18T09:00:00.000Z',
    },
  ];
  localNotifications = openFlow.setNotificationReadStateLocally(
    localNotifications,
    'notification-toggle',
    false,
  );

  assert.equal(localNotifications[0].readAt, null);
  assert.equal(domain.countUnreadNotifications(localNotifications), 1);

  let updateCount = 0;
  await openFlow.openNotificationDetail({
    notification: { id: 'notification-toggle', href: '/invitations', isRead: false },
    markRead: async () => {
      updateCount += 1;
    },
    navigate: () => {},
    onReadError: () => {},
    setLocalReadState: (isRead) => {
      localNotifications = openFlow.setNotificationReadStateLocally(
        localNotifications,
        'notification-toggle',
        isRead,
        '2026-08-18T10:10:00.000Z',
      );
    },
  });

  assert.equal(updateCount, 1);
  assert.equal(localNotifications[0].isRead, true);
  assert.equal(domain.countUnreadNotifications(localNotifications), 0);
});

test('un fallo de lectura restaura el contador sin bloquear ni alterar la navegación', async () => {
  const destination = `/barbershops/${barbershopId}/appointments/${reservationId}`;
  const localStates = [];
  const navigations = [];
  const reportedErrors = [];

  await assert.doesNotReject(async () => {
    const result = await openFlow.openNotificationDetail({
      notification: { id: 'notification-failing', href: destination, isRead: false },
      markRead: async () => {
        throw new Error('network unavailable');
      },
      navigate: (href) => {
        navigations.push(href);
      },
      onReadError: (error) => {
        reportedErrors.push(error);
      },
      setLocalReadState: (isRead) => {
        localStates.push(isRead);
      },
    });

    assert.equal(result, 'read-failed');
  });

  assert.deepEqual(localStates, [true, false]);
  assert.deepEqual(navigations, [destination]);
  assert.equal(reportedErrors.length, 1);
});

test('una notificación sin destino no cambia estado ni navega', async () => {
  const calls = [];

  const result = await openFlow.openNotificationDetail({
    notification: { id: 'notification-without-href', href: null, isRead: false },
    markRead: async () => {
      calls.push('mark-read');
    },
    navigate: () => {
      calls.push('navigate');
    },
    onReadError: () => {
      calls.push('read-error');
    },
    setLocalReadState: () => {
      calls.push('local');
    },
  });

  assert.equal(result, 'no-destination');
  assert.deepEqual(calls, []);
});

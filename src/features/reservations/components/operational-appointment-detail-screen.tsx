import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatLimaDate, formatLimaTime, formatPen, useFocusedResource } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { ListScreenSkeleton } from '@/shared/components/ui/list-screen-skeleton';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import {
  completeReservation,
  confirmCashPayment,
  confirmYapePayment,
  markReservationNoShow,
  refundPayment,
  startReservation,
} from '../actions';
import {
  getOperationalActions,
  validateYapeConfirmation,
  type OperationalActions,
  type YapeConfirmationFormErrors,
  type YapeConfirmationFormValues,
} from '../appointment-domain';
import { getReservationErrorMessage } from '../errors';
import { getOperationalAppointment } from '../queries';
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../reservation-domain';
import type { OperationalAppointment } from '../types';
import { APPOINTMENT_ACTION_COPY, type AppointmentAction } from './appointment-action-copy';
import { PaymentStatusBadge, ReservationStatusBadge } from './appointment-status-badge';
import { BarberAppointmentDetailSkeleton } from './barber-appointment-skeletons';
import { BarberOperationalAppointmentDetail } from './barber-operational-appointment-detail';

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <ThemedText style={styles.detailLabel} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function YapeConfirmationForm({
  appointment,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  appointment: OperationalAppointment;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: YapeConfirmationFormValues) => void;
}) {
  const [values, setValues] = useState<YapeConfirmationFormValues>({ reference: '', note: '' });
  const [errors, setErrors] = useState<YapeConfirmationFormErrors>({});

  const submit = () => {
    const parsed = validateYapeConfirmation(values);
    setErrors(parsed.errors);
    if (parsed.values) onSubmit(parsed.values);
  };

  return (
    <SurfaceCard style={styles.confirmationCard}>
      <ThemedText style={styles.sectionTitle}>Confirmar pago Yape</ThemedText>
      <ThemedText themeColor="textSecondary">
        Confirma que recibiste {formatPen(appointment.payment?.amount ?? appointment.totalPrice)} de{' '}
        {appointment.clientContact.fullName ?? 'este cliente'} mediante Yape.
      </ThemedText>
      <FormField
        autoCapitalize="characters"
        error={errors.reference}
        label="Referencia Yape"
        maxLength={120}
        onChangeText={(reference) => {
          setValues((current) => ({ ...current, reference }));
          setErrors((current) => ({ ...current, reference: undefined }));
        }}
        value={values.reference}
      />
      <FormField
        error={errors.note}
        label="Nota administrativa"
        maxLength={500}
        multiline
        onChangeText={(note) => {
          setValues((current) => ({ ...current, note }));
          setErrors((current) => ({ ...current, note: undefined }));
        }}
        value={values.note}
      />
      <ActionButton isLoading={isSubmitting} label="Confirmar pago Yape" onPress={submit} />
      <ActionButton disabled={isSubmitting} label="Volver" onPress={onCancel} variant="secondary" />
    </SurfaceCard>
  );
}

function AppointmentSummary({ appointment }: { appointment: OperationalAppointment }) {
  return (
    <View style={styles.column}>
      <SurfaceCard style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Cliente</ThemedText>
        <DetailLine
          label="Nombre"
          value={appointment.clientContact.fullName ?? 'Sin nombre registrado'}
        />
        <DetailLine label="Teléfono" value={appointment.clientContact.phone ?? 'No registrado'} />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Atención</ThemedText>
        <DetailLine label="Barbero" value={appointment.barberName} />
        <View style={styles.servicesList}>
          {appointment.items.map((item) => (
            <View key={item.id} style={styles.serviceRow}>
              <View style={styles.serviceCopy}>
                <ThemedText style={styles.serviceName}>{item.serviceName}</ThemedText>
                {item.styleName ? (
                  <ThemedText themeColor="textSecondary">Estilo: {item.styleName}</ThemedText>
                ) : null}
              </View>
              <ThemedText style={styles.serviceDuration} themeColor="textSecondary">
                {item.durationAtBooking} min
              </ThemedText>
            </View>
          ))}
        </View>
        <View style={styles.totalRow}>
          <View>
            <ThemedText style={styles.detailLabel} themeColor="textSecondary">
              Duración total
            </ThemedText>
            <ThemedText style={styles.totalValue}>
              {appointment.totalDurationMinutes} min
            </ThemedText>
          </View>
          <View style={styles.totalAmount}>
            <ThemedText style={styles.detailLabel} themeColor="textSecondary">
              Total
            </ThemedText>
            <ThemedText style={styles.totalValue}>{formatPen(appointment.totalPrice)}</ThemedText>
          </View>
        </View>
      </SurfaceCard>
    </View>
  );
}

function PaymentPanel({ appointment }: { appointment: OperationalAppointment }) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.sectionHeading}>
        <ThemedText style={styles.sectionTitle}>Pago</ThemedText>
        {appointment.payment ? <PaymentStatusBadge status={appointment.payment.status} /> : null}
      </View>
      {appointment.payment ? (
        <>
          <DetailLine label="Método" value={getPaymentMethodLabel(appointment.payment.method)} />
          <DetailLine label="Estado" value={getPaymentStatusLabel(appointment.payment.status)} />
          <DetailLine label="Importe" value={formatPen(appointment.payment.amount)} />
        </>
      ) : (
        <ThemedText themeColor="textSecondary">No hay un pago asociado visible.</ThemedText>
      )}
    </SurfaceCard>
  );
}

function AvailableActions({
  actions,
  appointment,
  isMutating,
  onRequest,
  onYape,
}: {
  actions: OperationalActions;
  appointment: OperationalAppointment;
  isMutating: boolean;
  onRequest: (action: AppointmentAction) => void;
  onYape: () => void;
}) {
  const hasActions = Object.values(actions).some(Boolean);

  return (
    <SurfaceCard style={styles.card}>
      <ThemedText style={styles.sectionTitle}>Acciones</ThemedText>
      {actions.canStart ? (
        <ActionButton
          disabled={isMutating}
          label="Iniciar atención"
          onPress={() => onRequest('start')}
        />
      ) : null}
      {actions.canComplete ? (
        <ActionButton
          disabled={isMutating}
          label="Completar atención"
          onPress={() => onRequest('complete')}
        />
      ) : null}
      {actions.canConfirmYape ? (
        <ActionButton
          disabled={isMutating}
          label="Confirmar pago Yape"
          onPress={onYape}
          variant="secondary"
        />
      ) : null}
      {actions.canConfirmCash ? (
        <ActionButton
          disabled={isMutating}
          label="Confirmar pago en efectivo"
          onPress={() => onRequest('cash')}
          variant="secondary"
        />
      ) : null}
      {actions.canRefund ? (
        <ActionButton
          disabled={isMutating}
          label="Registrar reembolso manual"
          onPress={() => onRequest('refund')}
          variant="danger"
        />
      ) : null}
      {actions.canMarkNoShow ? (
        <ActionButton
          disabled={isMutating}
          label="Marcar como no asistió"
          onPress={() => onRequest('no_show')}
          variant="danger"
        />
      ) : appointment.status === 'confirmed' ? (
        <ThemedText style={styles.guidance} themeColor="textSecondary">
          “No asistió” se habilita al terminar la tolerancia de 10 minutos.
        </ThemedText>
      ) : null}
      {!hasActions ? (
        <ThemedText style={styles.guidance} themeColor="textSecondary">
          No hay acciones disponibles para el estado actual.
        </ThemedText>
      ) : null}
    </SurfaceCard>
  );
}

export function OperationalAppointmentDetailScreen({
  barbershopId,
  barberId = null,
  reservationId,
}: {
  barbershopId: string | null;
  barberId?: string | null;
  reservationId: string | null;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [confirmation, setConfirmation] = useState<AppointmentAction | null>(null);
  const [showYapeForm, setShowYapeForm] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isMutatingRef = useRef(false);
  const load = useCallback(
    () =>
      user && barbershopId && reservationId
        ? getOperationalAppointment({ userId: user.id, barbershopId, barberId, reservationId })
        : Promise.resolve(null),
    [barberId, barbershopId, reservationId, user],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  const runAction = async (action: AppointmentAction, yapeValues?: YapeConfirmationFormValues) => {
    if (!data || isMutatingRef.current) return;
    isMutatingRef.current = true;
    setIsMutating(true);
    setMutationError(null);
    setFeedback(null);

    try {
      if (action === 'start') await startReservation(data.appointment.id);
      if (action === 'complete') await completeReservation(data.appointment.id);
      if (action === 'no_show') await markReservationNoShow(data.appointment.id);
      if (action === 'cash') await confirmCashPayment(data.appointment.id);
      if (action === 'yape' && yapeValues) {
        await confirmYapePayment({ reservationId: data.appointment.id, ...yapeValues });
      }
      if (action === 'refund') await refundPayment(data.appointment.id);

      setConfirmation(null);
      setShowYapeForm(false);
      setFeedback(APPOINTMENT_ACTION_COPY[action].success);
      await reload();
    } catch (actionError) {
      setMutationError(getReservationErrorMessage(actionError));
      await reload();
    } finally {
      isMutatingRef.current = false;
      setIsMutating(false);
    }
  };

  if (isLoading && !data) {
    if (barberId) return <BarberAppointmentDetailSkeleton />;
    return <ListScreenSkeleton rows={3} />;
  }

  if (!data || !reservationId || !barbershopId) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'No tienes acceso a esta cita.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  const { appointment, role } = data;
  const actions = getOperationalActions({
    actorRole: role,
    reservationStatus: appointment.status,
    startsAt: appointment.startsAt,
    paymentMethod: appointment.payment?.method ?? null,
    paymentStatus: appointment.payment?.status ?? null,
    isRefundEligible: appointment.isRefundEligible,
  });

  if (role === 'barber') {
    return (
      <BarberOperationalAppointmentDetail
        actions={actions}
        appointment={appointment}
        confirmation={confirmation}
        error={mutationError ?? error}
        feedback={feedback}
        isMutating={isMutating}
        isRefreshing={isRefreshing}
        onCancelConfirmation={() => setConfirmation(null)}
        onConfirmAction={(action) => void runAction(action)}
        onRefresh={() => void refresh()}
        onRequestAction={setConfirmation}
      />
    );
  }

  const isWide = width >= Layout.wideBreakpoint;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.headingBlock}>
          <ScreenHeading
            compact
            description={`${formatLimaTime(appointment.startsAt)} – ${formatLimaTime(appointment.endsAt)}`}
            eyebrow="Agenda administrativa"
            title={formatLimaDate(appointment.startsAt)}
          />
          <ReservationStatusBadge status={appointment.status} />
        </View>
        {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
        {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}

        <View style={[styles.columns, isWide ? styles.wideColumns : null]}>
          <AppointmentSummary appointment={appointment} />
          <View style={styles.column}>
            <PaymentPanel appointment={appointment} />
            {confirmation ? (
              <SurfaceCard style={styles.confirmationCard}>
                <ThemedText style={styles.sectionTitle}>
                  {APPOINTMENT_ACTION_COPY[confirmation].label}
                </ThemedText>
                <ThemedText themeColor="textSecondary">
                  {APPOINTMENT_ACTION_COPY[confirmation].confirmation}
                </ThemedText>
                <ActionButton
                  isLoading={isMutating}
                  label={APPOINTMENT_ACTION_COPY[confirmation].confirmLabel}
                  onPress={() => void runAction(confirmation)}
                  variant={
                    confirmation === 'no_show' || confirmation === 'refund' ? 'danger' : 'primary'
                  }
                />
                <ActionButton
                  disabled={isMutating}
                  label="Volver"
                  onPress={() => setConfirmation(null)}
                  variant="secondary"
                />
              </SurfaceCard>
            ) : showYapeForm ? (
              <YapeConfirmationForm
                appointment={appointment}
                isSubmitting={isMutating}
                onCancel={() => setShowYapeForm(false)}
                onSubmit={(values) => void runAction('yape', values)}
              />
            ) : (
              <AvailableActions
                actions={actions}
                appointment={appointment}
                isMutating={isMutating}
                onRequest={setConfirmation}
                onYape={() => setShowYapeForm(true)}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  headingBlock: { alignItems: 'flex-start', gap: Spacing.three },
  columns: { gap: Spacing.four },
  wideColumns: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { minWidth: 0, flex: 1, gap: Spacing.four },
  card: { gap: Spacing.three, padding: Spacing.four },
  confirmationCard: { gap: Spacing.three, padding: Spacing.four },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionTitle: { flex: 1, fontSize: TypeScale.title, fontWeight: '700' },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  detailLabel: { fontSize: TypeScale.label },
  detailValue: { minWidth: 0, flexShrink: 1, textAlign: 'right', fontWeight: '700' },
  servicesList: { gap: Spacing.three },
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  serviceCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  serviceName: { fontWeight: '700' },
  serviceDuration: { fontSize: TypeScale.label, fontVariant: ['tabular-nums'] },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  totalAmount: { alignItems: 'flex-end' },
  totalValue: { marginTop: Spacing.one, fontSize: TypeScale.title, fontWeight: '800' },
  guidance: { fontSize: TypeScale.label, lineHeight: 21 },
});

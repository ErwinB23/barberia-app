import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatLimaDate, formatLimaTime, formatPen, useFocusedResource } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
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
  type YapeConfirmationFormErrors,
  type YapeConfirmationFormValues,
} from '../appointment-domain';
import { getReservationErrorMessage } from '../errors';
import { getOperationalAppointment } from '../queries';
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../reservation-domain';
import { APPOINTMENT_ACTION_COPY, type AppointmentAction } from './appointment-action-copy';
import { PaymentStatusBadge, ReservationStatusBadge } from './appointment-status-badge';
import { BarberAppointmentDetailSkeleton } from './barber-appointment-skeletons';
import { BarberOperationalAppointmentDetail } from './barber-operational-appointment-detail';

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText selectable style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function YapeConfirmationForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: {
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
    <SurfaceCard style={styles.warningCard}>
      <ThemedText style={styles.sectionTitle}>Confirmar pago Yape</ThemedText>
      <ThemedText themeColor="textSecondary">
        Solo un administrador puede registrar esta confirmación. La referencia y la nota son
        opcionales.
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
      <ActionButton isLoading={isSubmitting} label="Confirmar Yape" onPress={submit} />
      <ActionButton
        disabled={isSubmitting}
        label="Cancelar"
        onPress={onCancel}
        variant="secondary"
      />
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
        ? getOperationalAppointment({
            userId: user.id,
            barbershopId,
            barberId,
            reservationId,
          })
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
    } finally {
      isMutatingRef.current = false;
      setIsMutating(false);
    }
  };

  if (isLoading && !data) {
    if (barberId) return <BarberAppointmentDetailSkeleton />;

    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando cita…</ThemedText>
      </ThemedView>
    );
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

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeading
          description={`${formatLimaDate(appointment.startsAt)} · ${formatLimaTime(appointment.startsAt)} – ${formatLimaTime(appointment.endsAt)}`}
          eyebrow={role === 'administrator' ? 'Agenda administrativa' : 'Mi agenda'}
          title={`Cita #${appointment.id.slice(0, 8).toUpperCase()}`}
        />
        {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
        {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}

        <SurfaceCard style={styles.card}>
          <View style={styles.headingRow}>
            <ThemedText style={styles.sectionTitle}>Cita</ThemedText>
            <ReservationStatusBadge status={appointment.status} />
          </View>
          <DetailLine label="Barbería" value={appointment.barbershopName} />
          <DetailLine label="Barbero" value={appointment.barberName} />
          <DetailLine
            label="Cliente"
            value={appointment.clientContact.fullName ?? 'Sin nombre registrado'}
          />
          <DetailLine label="Teléfono" value={appointment.clientContact.phone ?? 'No registrado'} />
          <DetailLine label="Duración" value={`${appointment.totalDurationMinutes} min`} />
          <DetailLine label="Total" value={formatPen(appointment.totalPrice)} />
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Servicios</ThemedText>
          {appointment.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemCopy}>
                <ThemedText style={styles.itemName}>{item.serviceName}</ThemedText>
                {item.styleName ? (
                  <ThemedText themeColor="textSecondary">Estilo: {item.styleName}</ThemedText>
                ) : null}
              </View>
              <ThemedText themeColor="textSecondary">{item.durationAtBooking} min</ThemedText>
            </View>
          ))}
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <View style={styles.headingRow}>
            <ThemedText style={styles.sectionTitle}>Pago</ThemedText>
            {appointment.payment ? (
              <PaymentStatusBadge status={appointment.payment.status} />
            ) : null}
          </View>
          {appointment.payment ? (
            <>
              <DetailLine
                label="Método"
                value={getPaymentMethodLabel(appointment.payment.method)}
              />
              <DetailLine
                label="Estado"
                value={getPaymentStatusLabel(appointment.payment.status)}
              />
              <DetailLine label="Importe" value={formatPen(appointment.payment.amount)} />
            </>
          ) : (
            <ThemedText themeColor="textSecondary">No hay un pago asociado visible.</ThemedText>
          )}
        </SurfaceCard>

        {confirmation ? (
          <SurfaceCard style={styles.warningCard}>
            <ThemedText style={styles.sectionTitle}>
              {APPOINTMENT_ACTION_COPY[confirmation].label}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {APPOINTMENT_ACTION_COPY[confirmation].confirmation} El backend validará nuevamente el
              estado y tus permisos.
            </ThemedText>
            <ActionButton
              isLoading={isMutating}
              label="Confirmar acción"
              onPress={() => void runAction(confirmation)}
              variant={
                confirmation === 'no_show' || confirmation === 'refund' ? 'danger' : 'primary'
              }
            />
            <ActionButton
              disabled={isMutating}
              label="Cancelar"
              onPress={() => setConfirmation(null)}
              variant="secondary"
            />
          </SurfaceCard>
        ) : showYapeForm ? (
          <YapeConfirmationForm
            isSubmitting={isMutating}
            onCancel={() => setShowYapeForm(false)}
            onSubmit={(values) => void runAction('yape', values)}
          />
        ) : (
          <SurfaceCard style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Acciones disponibles</ThemedText>
            {actions.canStart ? (
              <ActionButton label="Iniciar atención" onPress={() => setConfirmation('start')} />
            ) : null}
            {actions.canComplete ? (
              <ActionButton
                label="Completar atención"
                onPress={() => setConfirmation('complete')}
              />
            ) : null}
            {actions.canMarkNoShow ? (
              <ActionButton
                label="Marcar No asistió"
                onPress={() => setConfirmation('no_show')}
                variant="danger"
              />
            ) : appointment.status === 'confirmed' ? (
              <ThemedText themeColor="textSecondary">
                “No asistió” se habilita cuando termina la tolerancia de 10 minutos.
              </ThemedText>
            ) : null}
            {actions.canConfirmCash ? (
              <ActionButton
                label="Confirmar efectivo"
                onPress={() => setConfirmation('cash')}
                variant="secondary"
              />
            ) : null}
            {actions.canConfirmYape ? (
              <ActionButton
                label="Confirmar Yape"
                onPress={() => setShowYapeForm(true)}
                variant="secondary"
              />
            ) : null}
            {actions.canRefund ? (
              <ActionButton
                label="Registrar reembolso"
                onPress={() => setConfirmation('refund')}
                variant="danger"
              />
            ) : null}
            {!Object.values(actions).some(Boolean) ? (
              <ThemedText themeColor="textSecondary">
                No hay acciones operativas disponibles para el estado actual.
              </ThemedText>
            ) : null}
          </SurfaceCard>
        )}

        <ActionButton label="Actualizar" onPress={() => void reload()} variant="secondary" />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  card: { gap: Spacing.three, padding: Spacing.four },
  warningCard: { gap: Spacing.three, padding: Spacing.four },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionTitle: { flex: 1, fontSize: TypeScale.title, fontWeight: '700' },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  detailValue: { flexShrink: 1, textAlign: 'right', fontWeight: '700' },
  itemRow: { flexDirection: 'row', gap: Spacing.three },
  itemCopy: { flex: 1, gap: Spacing.one },
  itemName: { fontWeight: '700' },
});

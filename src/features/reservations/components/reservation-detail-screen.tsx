import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatLimaDate, formatLimaTime, formatPen, useFocusedResource } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { cancelReservation } from '../actions';
import { getReservationErrorMessage } from '../errors';
import { getClientReservation } from '../queries';
import {
  canCancelReservation,
  canRescheduleReservation,
  getPaymentStatusLabel,
  getReservationStatusLabel,
} from '../reservation-domain';

export function ReservationDetailScreen({
  reservationId,
  created = false,
}: {
  reservationId: string | null;
  created?: boolean;
}) {
  const { user } = useAuth();
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const load = useCallback(
    () =>
      user && reservationId ? getClientReservation(user.id, reservationId) : Promise.resolve(null),
    [reservationId, user],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);

  const cancel = async () => {
    if (!data) return;
    setIsCancelling(true);
    setMutationError(null);
    try {
      await cancelReservation(data.id);
      setShowCancelConfirmation(false);
      setFeedback(
        'La reserva fue cancelada. Revisa abajo la política aplicada y el estado del pago.',
      );
      await reload();
    } catch (cancellationError) {
      setMutationError(getReservationErrorMessage(cancellationError));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando reserva…</ThemedText>
      </ThemedView>
    );
  }

  if (!reservationId || !data) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'No encontramos esta reserva entre tus citas.'} />
        <ActionButton
          label="Ver mis reservas"
          onPress={() => router.replace('/reservations' as Href)}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeading
          description={`${formatLimaDate(data.startsAt)} · ${formatLimaTime(data.startsAt)} – ${formatLimaTime(data.endsAt)}`}
          eyebrow={getReservationStatusLabel(data.status)}
          title={created ? 'Reserva confirmada' : data.barbershopName}
        />
        {created ? (
          <StatusMessage
            message="Tu cita quedó confirmada. El pago puede permanecer pendiente según el método elegido."
            tone="success"
          />
        ) : null}
        {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
        {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}

        <SurfaceCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Cita</ThemedText>
          <DetailLine label="Barbería" value={data.barbershopName} />
          <DetailLine label="Profesional" value={data.barberName} />
          <DetailLine label="Estado" value={getReservationStatusLabel(data.status)} />
          <DetailLine label="Duración" value={`${data.totalDurationMinutes} min`} />
          <DetailLine label="Total" value={formatPen(data.totalPrice)} />
          {data.rescheduleCount > 0 ? <DetailLine label="Reprogramaciones" value="1 de 1" /> : null}
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Servicios reservados</ThemedText>
          {data.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemCopy}>
                <ThemedText style={styles.itemName}>{item.serviceName}</ThemedText>
                {item.styleName ? (
                  <ThemedText themeColor="textSecondary">Estilo: {item.styleName}</ThemedText>
                ) : null}
              </View>
              <View style={styles.itemMeta}>
                <ThemedText>{formatPen(item.priceAtBooking)}</ThemedText>
                <ThemedText themeColor="textSecondary">{item.durationAtBooking} min</ThemedText>
              </View>
            </View>
          ))}
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Pago</ThemedText>
          {data.payment ? (
            <>
              <DetailLine
                label="Método"
                value={data.payment.method === 'cash' ? 'Efectivo' : 'Yape'}
              />
              <DetailLine label="Estado" value={getPaymentStatusLabel(data.payment.status)} />
              <DetailLine label="Importe" value={formatPen(data.payment.amount)} />
            </>
          ) : (
            <ThemedText themeColor="textSecondary">
              No hay información de pago disponible.
            </ThemedText>
          )}
          {data.status === 'cancelled' ? (
            <ThemedText style={styles.policyNote} themeColor="textSecondary">
              {data.isLateCancellation
                ? data.isRefundEligible
                  ? 'La cancelación fue tardía, pero el snapshot de política marca el pago como elegible para reembolso. El estado final lo gestiona un administrador.'
                  : 'La cancelación fue tardía y el snapshot de política no considera el pago elegible para reembolso.'
                : 'La cancelación no fue tardía. Consulta el estado del pago para confirmar si el reembolso ya fue procesado.'}
            </ThemedText>
          ) : null}
        </SurfaceCard>

        {showCancelConfirmation ? (
          <SurfaceCard style={styles.warningCard}>
            <ThemedText style={styles.sectionTitle}>¿Cancelar esta cita?</ThemedText>
            <ThemedText themeColor="textSecondary">
              La base de datos aplicará la política snapshot y determinará si la cancelación es
              tardía y si existe elegibilidad de reembolso.
            </ThemedText>
            <ActionButton
              isLoading={isCancelling}
              label="Sí, cancelar reserva"
              onPress={() => void cancel()}
              variant="danger"
            />
            <ActionButton
              disabled={isCancelling}
              label="Conservar reserva"
              onPress={() => setShowCancelConfirmation(false)}
              variant="secondary"
            />
          </SurfaceCard>
        ) : null}

        {canRescheduleReservation(data) ? (
          <ActionButton
            label="Reprogramar una vez"
            onPress={() => router.push(`/reservations/${data.id}/reschedule` as Href)}
            variant="secondary"
          />
        ) : null}
        {canCancelReservation(data) && !showCancelConfirmation ? (
          <ActionButton
            label="Cancelar reserva"
            onPress={() => setShowCancelConfirmation(true)}
            variant="danger"
          />
        ) : null}
        <ActionButton label="Actualizar" onPress={() => void reload()} variant="secondary" />
      </ScrollView>
    </ThemedView>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
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
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  detailValue: { flexShrink: 1, textAlign: 'right', fontWeight: '700' },
  itemRow: { flexDirection: 'row', gap: Spacing.three },
  itemCopy: { flex: 1, gap: Spacing.one },
  itemName: { fontWeight: '700' },
  itemMeta: { alignItems: 'flex-end', gap: Spacing.one },
  policyNote: { fontSize: TypeScale.label, lineHeight: 21 },
});

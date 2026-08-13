import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { formatPen } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { changePaymentMethod } from '../actions';
import { canClientChangePaymentMethod } from '../appointment-domain';
import { getReservationErrorMessage } from '../errors';
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../reservation-domain';
import type { ClientReservation, PaymentMethod } from '../types';

export function ClientReservationPaymentCard({
  reservation,
  onRefresh,
}: {
  reservation: ClientReservation;
  onRefresh: () => Promise<void>;
}) {
  const [nextMethod, setNextMethod] = useState<PaymentMethod | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const payment = reservation.payment;
  const showQr = reservation.yapeSettings?.qrUrl?.startsWith('https://');

  const changeMethod = async () => {
    if (!payment || !nextMethod) return;
    setIsChanging(true);
    setError(null);
    setFeedback(null);

    try {
      await changePaymentMethod(reservation.id, nextMethod);
      setNextMethod(null);
      setFeedback(`El método de pago cambió a ${getPaymentMethodLabel(nextMethod)}.`);
      await onRefresh();
    } catch (changeError) {
      setError(getReservationErrorMessage(changeError));
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <>
      <SurfaceCard style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Pago</ThemedText>
        {payment ? (
          <>
            <DetailLine label="Método" value={getPaymentMethodLabel(payment.method)} />
            <DetailLine label="Estado" value={getPaymentStatusLabel(payment.status)} />
            <DetailLine label="Importe" value={formatPen(payment.amount)} />

            {payment.method === 'yape' && payment.status === 'pending' ? (
              <View style={styles.yapeBox}>
                {showQr ? (
                  <Image
                    accessibilityLabel="Código QR de Yape de la barbería"
                    contentFit="contain"
                    source={{ uri: reservation.yapeSettings!.qrUrl! }}
                    style={styles.qr}
                  />
                ) : null}
                {reservation.yapeSettings?.holderName ? (
                  <ThemedText selectable>Titular: {reservation.yapeSettings.holderName}</ThemedText>
                ) : null}
                {reservation.yapeSettings?.phone ? (
                  <ThemedText selectable>Número: {reservation.yapeSettings.phone}</ThemedText>
                ) : null}
                {!showQr &&
                !reservation.yapeSettings?.holderName &&
                !reservation.yapeSettings?.phone ? (
                  <ThemedText themeColor="textSecondary">
                    Los datos de Yape no están disponibles para esta reserva. El pago permanece
                    pendiente hasta que la barbería lo confirme.
                  </ThemedText>
                ) : null}
              </View>
            ) : null}

            {canClientChangePaymentMethod(reservation.status, payment.status) ? (
              <ActionButton
                label={`Cambiar a ${payment.method === 'cash' ? 'Yape' : 'Efectivo'}`}
                onPress={() => setNextMethod(payment.method === 'cash' ? 'yape' : 'cash')}
                variant="secondary"
              />
            ) : null}
          </>
        ) : (
          <ThemedText themeColor="textSecondary">No hay información de pago disponible.</ThemedText>
        )}

        {reservation.status === 'cancelled' ? (
          <ThemedText style={styles.policyNote} themeColor="textSecondary">
            {reservation.isLateCancellation
              ? reservation.isRefundEligible
                ? 'La cancelación fue tardía, pero el snapshot de política marca el pago como elegible para reembolso. El estado final lo gestiona un administrador.'
                : 'La cancelación fue tardía y el snapshot de política no considera el pago elegible para reembolso.'
              : 'La cancelación no fue tardía. Consulta el estado del pago para confirmar si el reembolso ya fue procesado.'}
          </ThemedText>
        ) : null}
        {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
        {error ? <StatusMessage message={error} /> : null}
      </SurfaceCard>

      {nextMethod ? (
        <SurfaceCard style={styles.confirmationCard}>
          <ThemedText style={styles.sectionTitle}>Cambiar método de pago</ThemedText>
          <ThemedText themeColor="textSecondary">
            El pago continuará pendiente y cambiará a {getPaymentMethodLabel(nextMethod)}.
          </ThemedText>
          <ActionButton
            isLoading={isChanging}
            label="Confirmar cambio"
            onPress={() => void changeMethod()}
          />
          <ActionButton
            disabled={isChanging}
            label="Cancelar"
            onPress={() => setNextMethod(null)}
            variant="secondary"
          />
        </SurfaceCard>
      ) : null}
    </>
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
  card: { gap: Spacing.three, padding: Spacing.four },
  confirmationCard: { gap: Spacing.three, padding: Spacing.four },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  detailValue: { flexShrink: 1, textAlign: 'right', fontWeight: '700' },
  yapeBox: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  qr: { width: 180, height: 180, borderRadius: Radius.medium },
  policyNote: { fontSize: TypeScale.label, lineHeight: 21 },
});

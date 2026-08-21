import { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { formatPen } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { changePaymentMethod } from '../actions';
import { canClientChangePaymentMethod } from '../appointment-domain';
import { getReservationErrorMessage } from '../errors';
import {
  getCancellationPolicyMessage,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '../reservation-domain';
import type { ClientReservation, PaymentMethod } from '../types';
import { PaymentStatusBadge } from './appointment-status-badge';

export function ClientReservationPaymentCard({
  reservation,
  onRefresh,
}: {
  reservation: ClientReservation;
  onRefresh: () => Promise<void>;
}) {
  const theme = useTheme();
  const isChangingRef = useRef(false);
  const [nextMethod, setNextMethod] = useState<PaymentMethod | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const payment = reservation.payment;
  const showQr = reservation.yapeSettings?.qrUrl?.startsWith('https://');

  const changeMethod = async () => {
    if (!payment || !nextMethod || isChangingRef.current) return;
    isChangingRef.current = true;
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
      isChangingRef.current = false;
      setIsChanging(false);
    }
  };

  return (
    <View style={styles.stack}>
      <SurfaceCard style={styles.card}>
        <View style={styles.headingRow}>
          <View style={[styles.headingIcon, { backgroundColor: theme.surfaceMuted }]}>
            <AppIcon
              color={theme.primary}
              name={{ ios: 'creditcard', android: 'payments', web: 'payments' }}
              size={20}
            />
          </View>
          <View style={styles.headingCopy}>
            <ThemedText style={styles.sectionTitle}>Pago</ThemedText>
            <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
              Estado e instrucciones de esta reserva.
            </ThemedText>
          </View>
          {payment ? <PaymentStatusBadge status={payment.status} /> : null}
        </View>

        {reservation.paymentUnavailable ? (
          <View style={styles.secondaryError}>
            <StatusMessage message="No pudimos cargar el estado del pago. La reserva sigue disponible y no se realizó ningún cambio." />
            <ActionButton
              label="Reintentar pago"
              onPress={() => void onRefresh()}
              variant="secondary"
            />
          </View>
        ) : payment ? (
          <>
            <View style={styles.details}>
              <DetailLine label="Método" value={getPaymentMethodLabel(payment.method)} />
              <DetailLine label="Importe" value={formatPen(payment.amount)} />
              <DetailLine label="Estado" value={getPaymentStatusLabel(payment.status)} />
            </View>

            {payment.method === 'yape' && payment.status === 'pending' ? (
              <View
                style={[
                  styles.yapeBox,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                ]}
              >
                <View style={styles.yapeHeading}>
                  <ThemedText style={styles.yapeTitle}>Paga con Yape</ThemedText>
                  <ThemedText style={styles.yapeCopy} themeColor="textSecondary">
                    Usa los datos de la barbería. El pago seguirá pendiente hasta su confirmación.
                  </ThemedText>
                </View>
                {showQr ? (
                  <Image
                    accessibilityLabel="Código QR de Yape de la barbería"
                    contentFit="contain"
                    source={{ uri: reservation.yapeSettings!.qrUrl! }}
                    style={[styles.qr, { backgroundColor: theme.surface }]}
                  />
                ) : null}
                <View style={styles.yapeDetails}>
                  {reservation.yapeSettings?.holderName ? (
                    <DetailLine label="Titular" value={reservation.yapeSettings.holderName} />
                  ) : null}
                  {reservation.yapeSettings?.phone ? (
                    <DetailLine label="Número" value={reservation.yapeSettings.phone} selectable />
                  ) : null}
                </View>
                {reservation.yapeSettingsUnavailable ? (
                  <View style={styles.secondaryError}>
                    <StatusMessage message="No pudimos cargar las instrucciones de Yape. La reserva y su pago permanecen sin cambios." />
                    <ActionButton
                      label="Reintentar instrucciones"
                      onPress={() => void onRefresh()}
                      variant="secondary"
                    />
                  </View>
                ) : null}
                {!reservation.yapeSettingsUnavailable &&
                !showQr &&
                !reservation.yapeSettings?.holderName &&
                !reservation.yapeSettings?.phone ? (
                  <ThemedText style={styles.yapeCopy} themeColor="textSecondary">
                    La barbería aún no tiene instrucciones de Yape disponibles para mostrar.
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
          <ThemedText style={styles.emptyPayment} themeColor="textSecondary">
            No hay información de pago disponible para esta reserva.
          </ThemedText>
        )}

        {reservation.status === 'cancelled' ? (
          <View style={[styles.policyNote, { backgroundColor: theme.surfaceMuted }]}>
            <ThemedText style={styles.policyTitle}>Política aplicada</ThemedText>
            <ThemedText style={styles.policyCopy} themeColor="textSecondary">
              {getCancellationPolicyMessage({
                isLateCancellation: reservation.isLateCancellation,
                isLateReschedule: reservation.isLateReschedule,
                isRefundEligible: reservation.isRefundEligible,
                paymentStatus: payment?.status ?? null,
              })}
            </ThemedText>
          </View>
        ) : null}
        {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
        {error ? <StatusMessage message={error} /> : null}
      </SurfaceCard>

      {nextMethod ? (
        <SurfaceCard style={styles.confirmationCard}>
          <ThemedText style={styles.sectionTitle}>Cambiar método de pago</ThemedText>
          <ThemedText style={styles.confirmationCopy} themeColor="textSecondary">
            El importe no cambia. El pago continuará pendiente con el método{' '}
            {getPaymentMethodLabel(nextMethod)}.
          </ThemedText>
          <ActionButton
            isLoading={isChanging}
            label="Confirmar cambio"
            onPress={() => void changeMethod()}
          />
          <ActionButton
            disabled={isChanging}
            label="Volver"
            onPress={() => setNextMethod(null)}
            variant="secondary"
          />
        </SurfaceCard>
      ) : null}
    </View>
  );
}

function DetailLine({
  label,
  value,
  selectable = false,
}: {
  label: string;
  value: string;
  selectable?: boolean;
}) {
  return (
    <View style={styles.detailLine}>
      <ThemedText style={styles.detailLabel} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable={selectable} style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.three },
  card: { gap: Spacing.four, padding: Spacing.four },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  headingIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  headingCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 20 },
  details: { gap: Spacing.three },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  detailLabel: { flexShrink: 0, fontSize: TypeScale.label },
  detailValue: {
    minWidth: 0,
    flexShrink: 1,
    textAlign: 'right',
    fontSize: TypeScale.label,
    fontWeight: '800',
  },
  yapeBox: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  yapeHeading: { gap: Spacing.one },
  yapeTitle: { fontSize: TypeScale.body, fontWeight: '800' },
  yapeCopy: { fontSize: TypeScale.label, lineHeight: 21 },
  qr: { width: 180, height: 180, alignSelf: 'center', borderRadius: Radius.medium },
  yapeDetails: { gap: Spacing.two },
  secondaryError: { gap: Spacing.two },
  emptyPayment: { fontSize: TypeScale.label, lineHeight: 21 },
  policyNote: { gap: Spacing.one, borderRadius: Radius.medium, padding: Spacing.three },
  policyTitle: { fontSize: TypeScale.label, fontWeight: '800' },
  policyCopy: { fontSize: TypeScale.label, lineHeight: 21 },
  confirmationCard: { gap: Spacing.three, padding: Spacing.four },
  confirmationCopy: { fontSize: TypeScale.body, lineHeight: 24 },
});

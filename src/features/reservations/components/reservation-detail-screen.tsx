import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatLimaDate, formatLimaTime, useFocusedResource } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { cancelReservation } from '../actions';
import { getReservationErrorMessage } from '../errors';
import { getClientReservation } from '../queries';
import {
  canCancelReservation,
  canRescheduleReservation,
  getClientReservationHref,
} from '../reservation-domain';
import type { ClientReservation } from '../types';
import { ClientReservationPaymentCard } from './client-reservation-payment-card';
import { ReservationReceipt } from './reservation-receipt';
import { ReservationDetailSkeleton, ReservationLoadError } from './reservation-screen-states';

export function ReservationDetailScreen({
  reservationId,
  created = false,
}: {
  reservationId: string | null;
  created?: boolean;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isCancellingRef = useRef(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const load = useCallback(
    () =>
      user && reservationId ? getClientReservation(user.id, reservationId) : Promise.resolve(null),
    [reservationId, user],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);
  const isWide = width >= Layout.wideBreakpoint;

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const cancel = async () => {
    if (!data || isCancellingRef.current) return;
    isCancellingRef.current = true;
    setIsCancelling(true);
    setMutationError(null);
    setFeedback(null);
    try {
      await cancelReservation(data.id);
      setShowCancelConfirmation(false);
      setFeedback(
        'La reserva fue cancelada. El detalle ya muestra la política y el estado del pago aplicados.',
      );
      await reload();
    } catch (cancellationError) {
      setMutationError(getReservationErrorMessage(cancellationError));
    } finally {
      isCancellingRef.current = false;
      setIsCancelling(false);
    }
  };

  if (isLoading && data === null) return <ReservationDetailSkeleton />;

  if (!reservationId || !data) {
    return (
      <ReservationLoadError
        message={error ?? 'No encontramos esta reserva entre tus citas.'}
        onBack={() => router.replace('/reservations' as Href)}
        onRetry={() => void reload()}
      />
    );
  }

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
        <View style={styles.heading}>
          <ScreenHeading
            description={
              created
                ? 'Tu cita está confirmada. Aquí encontrarás el comprobante y el estado del pago.'
                : `${data.barbershopName}, ${formatLimaDate(data.startsAt)} a las ${formatLimaTime(data.startsAt)}`
            }
            eyebrow={created ? 'Reserva creada' : 'Tu reserva'}
            title={created ? 'Reserva confirmada' : 'Detalle de tu cita'}
          />
          {created ? (
            <StatusMessage
              message="La reserva ya está registrada. El pago puede continuar pendiente según el método elegido."
              tone="success"
            />
          ) : null}
          {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
          {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
        </View>

        <View style={[styles.layout, isWide ? styles.wideLayout : null]}>
          <View style={styles.mainColumn}>
            <ReservationReceipt reservation={data} />
          </View>
          <View style={styles.sideColumn}>
            <ClientReservationPaymentCard onRefresh={reload} reservation={data} />
            <ReservationActions
              isCancelling={isCancelling}
              onCancel={() => void cancel()}
              onCloseCancellation={() => setShowCancelConfirmation(false)}
              onOpenCancellation={() => setShowCancelConfirmation(true)}
              reservation={data}
              showCancelConfirmation={showCancelConfirmation}
            />
            {created ? (
              <ActionButton
                label="Volver al inicio"
                onPress={() => router.replace('/' as Href)}
                variant="secondary"
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function ReservationActions({
  reservation,
  showCancelConfirmation,
  isCancelling,
  onOpenCancellation,
  onCloseCancellation,
  onCancel,
}: {
  reservation: ClientReservation;
  showCancelConfirmation: boolean;
  isCancelling: boolean;
  onOpenCancellation: () => void;
  onCloseCancellation: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const canReschedule = canRescheduleReservation(reservation);
  const canCancel = canCancelReservation(reservation);
  const canManage = canReschedule || canCancel;
  const usedReschedule = reservation.rescheduleCount >= 1;

  return (
    <SurfaceCard style={styles.actionsCard}>
      <View style={styles.actionHeading}>
        <View style={[styles.actionIcon, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'calendar.badge.clock', android: 'edit_calendar', web: 'edit_calendar' }}
            size={20}
          />
        </View>
        <View style={styles.actionHeadingCopy}>
          <ThemedText style={styles.actionTitle}>Gestionar cita</ThemedText>
          <ThemedText style={styles.actionDescription} themeColor="textSecondary">
            Las opciones disponibles respetan el estado y las reglas de tu reserva.
          </ThemedText>
        </View>
      </View>

      {showCancelConfirmation ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.cancelConfirmation,
            { backgroundColor: theme.dangerSurface, borderColor: theme.danger },
          ]}
        >
          <ThemedText style={styles.cancelTitle}>¿Cancelar esta cita?</ThemedText>
          <ThemedText style={styles.cancelCopy}>
            Esta acción no se puede deshacer. Si la cancelación se considera tardía, se aplicará la
            política guardada para la reserva. La barbería procesa los reembolsos elegibles.
          </ThemedText>
          <ActionButton
            isLoading={isCancelling}
            label="Sí, cancelar cita"
            onPress={onCancel}
            variant="danger"
          />
          <ActionButton
            disabled={isCancelling}
            label="Conservar cita"
            onPress={onCloseCancellation}
            variant="secondary"
          />
        </View>
      ) : (
        <>
          {canReschedule ? (
            <ActionButton
              label="Reprogramar cita"
              onPress={() =>
                router.push(`${getClientReservationHref(reservation.id)}/reschedule` as Href)
              }
              variant="secondary"
            />
          ) : null}
          {usedReschedule && reservation.status === 'confirmed' ? (
            <ThemedText style={styles.actionNote} themeColor="textSecondary">
              Ya utilizaste la única reprogramación disponible para esta reserva.
            </ThemedText>
          ) : null}
          {canCancel ? (
            <ActionButton label="Cancelar reserva" onPress={onOpenCancellation} variant="danger" />
          ) : null}
          {!canManage && !usedReschedule ? (
            <ThemedText style={styles.actionNote} themeColor="textSecondary">
              Esta reserva ya no admite cambios desde la aplicación.
            </ThemedText>
          ) : null}
        </>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  heading: { maxWidth: Layout.contentMaxWidth, gap: Spacing.three },
  layout: { gap: Spacing.four },
  wideLayout: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { minWidth: 0, flex: 1.35 },
  sideColumn: { minWidth: 0, flex: 0.85, gap: Spacing.four },
  actionsCard: { gap: Spacing.three, padding: Spacing.four },
  actionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  actionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  actionHeadingCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  actionTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  actionDescription: { fontSize: TypeScale.label, lineHeight: 20 },
  actionNote: { fontSize: TypeScale.label, lineHeight: 21 },
  cancelConfirmation: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  cancelTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  cancelCopy: { fontSize: TypeScale.label, lineHeight: 22 },
});

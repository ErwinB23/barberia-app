import { StyleSheet, View } from 'react-native';

import { formatLimaTime } from '@/features/booking';
import {
  PaymentStatusBadge,
  ReservationStatusBadge,
} from '@/features/reservations/components/appointment-status-badge';
import { getPaymentMethodLabel } from '@/features/reservations/reservation-domain';
import type { OperationalAppointment } from '@/features/reservations/types';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import type { BarberHomeEmptyState } from '../barber-home-domain';
import { getReservationServicesSummary } from '../client-home-domain';

export function BarberNextAppointment({
  appointment,
  onOpen,
}: {
  appointment: OperationalAppointment;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const services = getReservationServicesSummary(appointment.items) ?? 'Servicios reservados';

  return (
    <SurfaceCard
      accessibilityLabel={`Próxima cita a las ${formatLimaTime(appointment.startsAt)}`}
      elevated
      style={[styles.card, { borderColor: theme.primary }]}
    >
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <ThemedText style={styles.label} themeColor="primary">
            Próxima cita
          </ThemedText>
          <ThemedText selectable style={styles.time}>
            {formatLimaTime(appointment.startsAt)}
          </ThemedText>
        </View>
        <ReservationStatusBadge status={appointment.status} />
      </View>

      <View style={styles.details}>
        <ThemedText numberOfLines={1} style={styles.client}>
          {appointment.clientContact.fullName ?? 'Cliente sin nombre registrado'}
        </ThemedText>
        <ThemedText numberOfLines={2} style={styles.services} themeColor="textSecondary">
          {services}
        </ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
              size={17}
            />
            <ThemedText style={styles.metaText} themeColor="textSecondary">
              {appointment.totalDurationMinutes} min
            </ThemedText>
          </View>
          {appointment.payment ? (
            <View style={styles.paymentRow}>
              <ThemedText style={styles.metaText} themeColor="textSecondary">
                {getPaymentMethodLabel(appointment.payment.method)}
              </ThemedText>
              <PaymentStatusBadge status={appointment.payment.status} />
            </View>
          ) : null}
        </View>
      </View>

      <ActionButton label="Ver cita" onPress={onOpen} />
    </SurfaceCard>
  );
}

export function BarberNextAppointmentEmpty({
  emptyState,
  onOpenAgenda,
}: {
  emptyState: Exclude<BarberHomeEmptyState, null>;
  onOpenAgenda: () => void;
}) {
  const theme = useTheme();
  const isDayComplete = emptyState === 'day_complete';

  return (
    <SurfaceCard style={styles.emptyCard}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon
          color={theme.primary}
          name={
            isDayComplete
              ? { ios: 'checkmark.circle', android: 'task_alt', web: 'task_alt' }
              : { ios: 'calendar', android: 'event_available', web: 'event_available' }
          }
          size={27}
        />
      </View>
      <View style={styles.emptyCopy}>
        <ThemedText style={styles.emptyTitle}>
          {isDayComplete ? 'Jornada al día' : 'Hoy tienes la agenda libre'}
        </ThemedText>
        <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
          {isDayComplete
            ? 'No tienes más citas programadas para hoy.'
            : 'No tienes citas programadas para hoy.'}
        </ThemedText>
      </View>
      <ActionButton label="Ver agenda" onPress={onOpenAgenda} size="compact" variant="secondary" />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headingCopy: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.one,
  },
  label: {
    fontSize: TypeScale.label,
    fontWeight: '800',
  },
  time: {
    fontSize: TypeScale.display,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
    fontVariant: ['tabular-nums'],
  },
  details: {
    gap: Spacing.two,
  },
  client: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    lineHeight: 27,
  },
  services: {
    fontSize: TypeScale.body,
    lineHeight: 23,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  metaItem: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaText: {
    fontSize: TypeScale.label,
  },
  emptyCard: {
    minHeight: 164,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  emptyCopy: {
    minWidth: 180,
    flex: 1,
    gap: Spacing.one,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});

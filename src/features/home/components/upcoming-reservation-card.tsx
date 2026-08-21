import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { formatLimaDate, formatLimaTime } from '@/features/booking';
import { getReservationStatusLabel } from '@/features/reservations/reservation-domain';
import type { ClientReservation } from '@/features/reservations/types';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getReservationServicesSummary } from '../client-home-domain';

type UpcomingReservationCardProps = {
  reservation: ClientReservation;
};

export function UpcomingReservationCard({ reservation }: UpcomingReservationCardProps) {
  const theme = useTheme();
  const services = getReservationServicesSummary(reservation.items);

  return (
    <SurfaceCard elevated style={styles.card}>
      <View style={styles.topRow}>
        <ThemedText style={styles.eyebrow} themeColor="primary">
          Próxima cita
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: theme.successSurface }]}>
          <ThemedText style={styles.statusLabel} themeColor="success">
            {getReservationStatusLabel(reservation.status)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.primaryCopy}>
        <ThemedText style={styles.barbershopName}>{reservation.barbershopName}</ThemedText>
        <View style={styles.dateRow}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
            size={20}
          />
          <ThemedText style={styles.dateText}>
            {formatLimaDate(reservation.startsAt)} · {formatLimaTime(reservation.startsAt)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.details}>
        <ThemedText style={styles.detailText} themeColor="textSecondary">
          Con {reservation.barberName}
        </ThemedText>
        {services ? (
          <ThemedText numberOfLines={2} style={styles.detailText} themeColor="textSecondary">
            {services}
          </ThemedText>
        ) : null}
      </View>

      <ActionButton
        label="Ver reserva"
        onPress={() =>
          router.push({
            pathname: '/reservations/[reservationId]',
            params: { reservationId: reservation.id },
          })
        }
      />
    </SurfaceCard>
  );
}

export function NoUpcomingReservationCard() {
  const theme = useTheme();

  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
      <View style={styles.primaryCopy}>
        <ThemedText style={styles.emptyTitle}>¿Listo para tu próximo corte?</ThemedText>
        <ThemedText style={styles.detailText} themeColor="textSecondary">
          Encuentra una barbería y reserva en pocos pasos.
        </ThemedText>
      </View>
      <ActionButton label="Explorar barberías" onPress={() => router.push('/explore')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  topRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  statusBadge: {
    minHeight: 28,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
  },
  statusLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  primaryCopy: {
    gap: Spacing.two,
  },
  barbershopName: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dateText: {
    flex: 1,
    fontSize: TypeScale.body,
    fontWeight: '600',
    lineHeight: 24,
  },
  details: {
    gap: Spacing.one,
  },
  detailText: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  emptyCard: {
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
});

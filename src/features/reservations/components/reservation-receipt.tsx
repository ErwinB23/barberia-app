import { StyleSheet, View } from 'react-native';

import { formatLimaDate, formatLimaTime, formatPen } from '@/features/booking';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import type { ClientReservation } from '../types';
import { ReservationStatusBadge } from './appointment-status-badge';

export function ReservationReceipt({ reservation }: { reservation: ClientReservation }) {
  const theme = useTheme();

  return (
    <View style={styles.column}>
      <SurfaceCard style={styles.heroCard}>
        <View style={styles.statusRow}>
          <ReservationStatusBadge status={reservation.status} />
          {reservation.rescheduleCount > 0 ? (
            <ThemedText style={styles.rescheduleCount} themeColor="textSecondary">
              Reprogramación utilizada
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.dateBlock}>
          <ThemedText style={styles.date}>{formatLimaDate(reservation.startsAt)}</ThemedText>
          <ThemedText style={styles.time} themeColor="primary">
            {formatLimaTime(reservation.startsAt)} a {formatLimaTime(reservation.endsAt)}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.contextGrid}>
          <ContextItem
            icon={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            label="Barbería"
            value={reservation.barbershopName}
          />
          <ContextItem
            icon={{ ios: 'person.crop.circle', android: 'person', web: 'person' }}
            label="Profesional"
            value={reservation.barberName}
          />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.servicesCard}>
        <View style={styles.sectionHeading}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.surfaceMuted }]}>
            <AppIcon
              color={theme.primary}
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={20}
            />
          </View>
          <View style={styles.sectionCopy}>
            <ThemedText style={styles.sectionTitle}>Servicios reservados</ThemedText>
            <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
              Los nombres, precios y duraciones corresponden al momento de la reserva.
            </ThemedText>
          </View>
        </View>

        {reservation.itemsUnavailable ? (
          <StatusMessage message="No pudimos cargar los servicios de esta reserva. El resto del detalle sigue disponible." />
        ) : (
          <View style={styles.serviceList}>
            {reservation.items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.serviceRow,
                  index > 0
                    ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }
                    : null,
                ]}
              >
                <View style={styles.serviceCopy}>
                  <ThemedText style={styles.serviceName}>{item.serviceName}</ThemedText>
                  {item.styleName ? (
                    <ThemedText style={styles.styleName} themeColor="textSecondary">
                      Estilo: {item.styleName}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.serviceMeta}>
                  <ThemedText style={styles.servicePrice}>
                    {formatPen(item.priceAtBooking)}
                  </ThemedText>
                  <ThemedText style={styles.serviceDuration} themeColor="textSecondary">
                    {item.durationAtBooking} min
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.totalBlock, { backgroundColor: theme.surfaceMuted }]}>
          <View style={styles.totalCopy}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalDuration} themeColor="textSecondary">
              {reservation.totalDurationMinutes} min en total
            </ThemedText>
          </View>
          <ThemedText style={styles.totalPrice}>{formatPen(reservation.totalPrice)}</ThemedText>
        </View>
      </SurfaceCard>
    </View>
  );
}

function ContextItem({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof AppIcon>[0]['name'];
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.contextItem}>
      <View style={[styles.contextIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon color={theme.textSecondary} name={icon} size={19} />
      </View>
      <View style={styles.contextCopy}>
        <ThemedText style={styles.contextLabel} themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText style={styles.contextValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: Spacing.four },
  heroCard: { gap: Spacing.four, padding: Spacing.four },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rescheduleCount: {
    flexShrink: 1,
    fontSize: TypeScale.caption,
    fontWeight: '700',
    textAlign: 'right',
  },
  dateBlock: { gap: Spacing.one },
  date: { fontSize: TypeScale.title, fontWeight: '800', lineHeight: 28 },
  time: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 38,
  },
  divider: { height: StyleSheet.hairlineWidth },
  contextGrid: { gap: Spacing.three },
  contextItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  contextIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  contextCopy: { minWidth: 0, flex: 1, gap: 2 },
  contextLabel: { fontSize: TypeScale.caption },
  contextValue: { fontSize: TypeScale.body, fontWeight: '700', lineHeight: 22 },
  servicesCard: { gap: Spacing.four, padding: Spacing.four },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  sectionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  sectionCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  serviceList: { gap: 0 },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  serviceCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  serviceName: { fontSize: TypeScale.body, fontWeight: '800', lineHeight: 22 },
  styleName: { fontSize: TypeScale.label, lineHeight: 20 },
  serviceMeta: { alignItems: 'flex-end', gap: Spacing.one },
  servicePrice: { fontSize: TypeScale.body, fontWeight: '800', fontVariant: ['tabular-nums'] },
  serviceDuration: { fontSize: TypeScale.caption },
  totalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  totalCopy: { minWidth: 0, flex: 1, gap: 2 },
  totalLabel: { fontSize: TypeScale.body, fontWeight: '800' },
  totalDuration: { fontSize: TypeScale.caption },
  totalPrice: { fontSize: TypeScale.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
});

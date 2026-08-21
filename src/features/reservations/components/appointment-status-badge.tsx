import { StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getPaymentStatusLabel, getReservationStatusLabel } from '../reservation-domain';
import type { PaymentStatus, ReservationStatus } from '../types';

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const theme = useTheme();
  const palette = {
    confirmed: { color: theme.warning, backgroundColor: theme.warningSurface },
    in_progress: { color: theme.primary, backgroundColor: theme.surfaceMuted },
    completed: { color: theme.success, backgroundColor: theme.successSurface },
    cancelled: { color: theme.danger, backgroundColor: theme.dangerSurface },
    no_show: { color: theme.textSecondary, backgroundColor: theme.surfaceMuted },
  }[status];

  return (
    <ThemedText
      accessibilityLabel={`Estado de reserva: ${getReservationStatusLabel(status)}`}
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.color,
          color: palette.color,
        },
      ]}
    >
      {getReservationStatusLabel(status)}
    </ThemedText>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const theme = useTheme();
  const palette = {
    pending: { color: theme.warning, backgroundColor: theme.warningSurface },
    paid: { color: theme.success, backgroundColor: theme.successSurface },
    refunded: { color: theme.primary, backgroundColor: theme.surfaceMuted },
    failed: { color: theme.danger, backgroundColor: theme.dangerSurface },
  }[status];

  return (
    <ThemedText
      accessibilityLabel={`Estado del pago: ${getPaymentStatusLabel(status)}`}
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.color,
          color: palette.color,
        },
      ]}
    >
      {getPaymentStatusLabel(status)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
});

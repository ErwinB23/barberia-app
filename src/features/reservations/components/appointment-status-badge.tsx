import { StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getPaymentStatusLabel, getReservationStatusLabel } from '../reservation-domain';
import type { PaymentStatus, ReservationStatus } from '../types';

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const theme = useTheme();
  const isPositive = status === 'completed';
  const isWarning = status === 'confirmed' || status === 'in_progress';
  const color = isPositive ? theme.success : isWarning ? theme.warning : theme.textSecondary;
  const backgroundColor = isPositive
    ? theme.successSurface
    : isWarning
      ? theme.warningSurface
      : theme.surfaceMuted;

  return (
    <ThemedText style={[styles.badge, { backgroundColor, color }]}>
      {getReservationStatusLabel(status)}
    </ThemedText>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const theme = useTheme();
  const isPositive = status === 'paid' || status === 'refunded';
  const isWarning = status === 'pending';
  const color = isPositive ? theme.success : isWarning ? theme.warning : theme.danger;
  const backgroundColor = isPositive
    ? theme.successSurface
    : isWarning
      ? theme.warningSurface
      : theme.dangerSurface;

  return (
    <ThemedText style={[styles.badge, { backgroundColor, color }]}>
      {getPaymentStatusLabel(status)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
});

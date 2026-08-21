import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { formatPen } from '../booking-domain';

export function BookingActionBar({
  selectedServiceCount,
  totalDurationMinutes,
  totalPrice,
  primaryLabel,
  primaryDisabled,
  isLoading,
  showBack,
  onBack,
  onContinue,
}: {
  selectedServiceCount: number;
  totalDurationMinutes: number;
  totalPrice: number;
  primaryLabel: string;
  primaryDisabled: boolean;
  isLoading: boolean;
  showBack: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const serviceLabel = `${selectedServiceCount} ${selectedServiceCount === 1 ? 'servicio' : 'servicios'}`;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          boxShadow: `0 -10px 28px ${theme.cardShadow}`,
          paddingBottom: Math.max(insets.bottom, Spacing.three),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.summary}>
          <SummaryValue label="Selección" value={serviceLabel} />
          <SummaryValue label="Duración" value={`${totalDurationMinutes} min`} />
          <SummaryValue label="Total" value={formatPen(totalPrice)} />
        </View>
        <View style={styles.actions}>
          {showBack ? (
            <View style={styles.backAction}>
              <ActionButton
                disabled={isLoading}
                label="Atrás"
                onPress={onBack}
                variant="secondary"
              />
            </View>
          ) : null}
          <View style={styles.primaryAction}>
            <ActionButton
              disabled={primaryDisabled}
              isLoading={isLoading}
              label={primaryLabel}
              onPress={onContinue}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <ThemedText style={styles.summaryLabel} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText numberOfLines={1} style={styles.summaryValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryItem: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: TypeScale.caption - 1,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: TypeScale.label,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  backAction: {
    width: 112,
  },
  primaryAction: {
    flex: 1,
  },
});

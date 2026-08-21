import { StyleSheet, View } from 'react-native';

import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import type { BarberHomeSummary } from '../barber-home-domain';

const METRICS = [
  { key: 'total', label: 'Citas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
] as const;

export function BarberTodaySummary({ summary }: { summary: BarberHomeSummary }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
        Resumen de hoy
      </ThemedText>
      <SurfaceCard
        accessibilityLabel={`${summary.total} citas, ${summary.pending} pendientes y ${summary.completed} completadas`}
        style={styles.card}
      >
        {METRICS.map((metric, index) => (
          <View
            key={metric.key}
            style={[
              styles.metric,
              index > 0 ? { borderLeftColor: theme.border, borderLeftWidth: 1 } : null,
            ]}
          >
            <ThemedText selectable style={styles.value}>
              {summary[metric.key]}
            </ThemedText>
            <ThemedText numberOfLines={2} style={styles.label} themeColor="textSecondary">
              {metric.label}
            </ThemedText>
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  card: {
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.three,
  },
  metric: {
    minWidth: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  value: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
});

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import type { AdminHomeSummary } from '../admin-home-domain';

const METRICS = [
  { key: 'total', label: 'Total' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'inProgress', label: 'En atención' },
  { key: 'completed', label: 'Completadas' },
] as const;

export function AdminTodaySummary({
  summary,
  isWide,
  onOpenAgenda,
  onRetry,
}: {
  summary: AdminHomeSummary | null;
  isWide: boolean;
  onOpenAgenda: () => void;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isAgendaFocused, setIsAgendaFocused] = useState(false);
  const [isRetryFocused, setIsRetryFocused] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
            Hoy
          </ThemedText>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            Estado operativo de la jornada en Lima.
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="link"
          onBlur={() => setIsAgendaFocused(false)}
          onFocus={() => setIsAgendaFocused(true)}
          onPress={onOpenAgenda}
          style={({ pressed }) => [
            styles.headerAction,
            isAgendaFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
            getPressedScaleStyle(pressed, reduceMotion, 0.98),
          ]}
        >
          <ThemedText style={styles.headerActionLabel} themeColor="primary">
            Ver agenda
          </ThemedText>
        </Pressable>
      </View>

      {summary ? (
        <SurfaceCard
          accessibilityLabel={`${summary.total} citas hoy, ${summary.confirmed} confirmadas, ${summary.inProgress} en atención y ${summary.completed} completadas`}
          style={[styles.metrics, isWide ? styles.wideMetrics : null]}
        >
          {METRICS.map((metric, index) => (
            <View
              key={metric.key}
              style={[
                styles.metric,
                isWide ? styles.wideMetric : null,
                {
                  borderColor: theme.border,
                  borderLeftWidth: isWide && index > 0 ? StyleSheet.hairlineWidth : 0,
                  borderTopWidth: !isWide && index > 1 ? StyleSheet.hairlineWidth : 0,
                },
              ]}
            >
              <ThemedText selectable style={styles.metricValue}>
                {summary[metric.key]}
              </ThemedText>
              <ThemedText numberOfLines={2} style={styles.metricLabel} themeColor="textSecondary">
                {metric.label}
              </ThemedText>
            </View>
          ))}
        </SurfaceCard>
      ) : (
        <View style={styles.error}>
          <StatusMessage message="No pudimos cargar el resumen de hoy." />
          <Pressable
            accessibilityRole="button"
            onBlur={() => setIsRetryFocused(false)}
            onFocus={() => setIsRetryFocused(true)}
            onPress={onRetry}
            style={[
              styles.retryButton,
              isRetryFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
            ]}
          >
            <ThemedText style={styles.retryLabel} themeColor="primary">
              Reintentar
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  sectionHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700', letterSpacing: -0.3 },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 20 },
  headerAction: { minHeight: 48, justifyContent: 'center', paddingLeft: Spacing.two },
  headerActionLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    paddingVertical: Spacing.two,
  },
  wideMetrics: { flexWrap: 'nowrap' },
  metric: {
    width: '50%',
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  wideMetric: { width: 'auto', flex: 1 },
  metricValue: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  error: { gap: Spacing.two },
  retryButton: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center' },
  retryLabel: { fontSize: TypeScale.label, fontWeight: '700' },
});

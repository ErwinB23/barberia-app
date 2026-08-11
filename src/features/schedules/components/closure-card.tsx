import { StyleSheet, View } from 'react-native';

import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { formatLimaDateTime, getClosureTimingLabel } from '../formatters';
import type { BarbershopClosure } from '../types';
import { ScheduleTextButton } from './schedule-text-button';

type ClosureCardProps = {
  closure: BarbershopClosure;
  isDeleting: boolean;
  onDelete: () => void;
};

export function ClosureCard({ closure, isDeleting, onDelete }: ClosureCardProps) {
  const theme = useTheme();
  const timingLabel = getClosureTimingLabel(closure.startsAt);
  const timingColor = timingLabel === 'En curso' ? theme.warning : theme.primary;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <ThemedText style={styles.title}>{closure.reason ?? 'Cierre excepcional'}</ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Horario de Lima
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.dot, { backgroundColor: timingColor }]} />
          <ThemedText style={[styles.badgeLabel, { color: timingColor }]}>{timingLabel}</ThemedText>
        </View>
      </View>

      <View style={styles.range}>
        <View style={styles.rangeItem}>
          <ThemedText style={styles.rangeLabel} themeColor="textSecondary">
            Desde
          </ThemedText>
          <ThemedText selectable style={styles.rangeValue}>
            {formatLimaDateTime(closure.startsAt)}
          </ThemedText>
        </View>
        <View style={styles.rangeItem}>
          <ThemedText style={styles.rangeLabel} themeColor="textSecondary">
            Hasta
          </ThemedText>
          <ThemedText selectable style={styles.rangeValue}>
            {formatLimaDateTime(closure.endsAt)}
          </ThemedText>
        </View>
      </View>

      <ScheduleTextButton
        disabled={isDeleting}
        label="Eliminar cierre"
        onPress={onDelete}
        tone="danger"
      />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: TypeScale.caption,
  },
  badge: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
  },
  badgeLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  range: {
    gap: Spacing.three,
  },
  rangeItem: {
    gap: Spacing.one,
  },
  rangeLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  rangeValue: {
    fontSize: TypeScale.body,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

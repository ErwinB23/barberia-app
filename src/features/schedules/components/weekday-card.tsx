import { StyleSheet, View } from 'react-native';

import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getWeekdayName, type Weekday } from '../schedule-domain';
import type { BarbershopHour } from '../types';
import { ScheduleTextButton } from './schedule-text-button';

type WeekdayCardProps = {
  weekday: Weekday;
  intervals: BarbershopHour[];
  deletingId: string | null;
  onAdd: () => void;
  onDelete: (hour: BarbershopHour) => void;
  onEdit: (hour: BarbershopHour) => void;
};

export function WeekdayCard({
  weekday,
  intervals,
  deletingId,
  onAdd,
  onDelete,
  onEdit,
}: WeekdayCardProps) {
  const theme = useTheme();
  const isOpen = intervals.length > 0;
  const stateColor = isOpen ? theme.success : theme.textSecondary;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        <ThemedText style={styles.day}>{getWeekdayName(weekday)}</ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.dot, { backgroundColor: stateColor }]} />
          <ThemedText style={[styles.badgeLabel, { color: stateColor }]}>
            {isOpen ? 'Abierto' : 'Cerrado'}
          </ThemedText>
        </View>
      </View>

      {isOpen ? (
        <View style={styles.intervals}>
          {intervals.map((hour) => (
            <View key={hour.id} style={[styles.interval, { borderTopColor: theme.border }]}>
              <ThemedText selectable style={styles.time}>
                {hour.startTime} – {hour.endTime}
              </ThemedText>
              <View style={styles.intervalActions}>
                <ScheduleTextButton label="Editar" onPress={() => onEdit(hour)} />
                <ScheduleTextButton
                  disabled={deletingId === hour.id}
                  label="Eliminar"
                  onPress={() => onDelete(hour)}
                  tone="danger"
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText style={styles.closedCopy} themeColor="textSecondary">
          No hay intervalos de atención configurados.
        </ThemedText>
      )}

      <View style={styles.addAction}>
        <ScheduleTextButton
          label={isOpen ? 'Agregar otro intervalo' : 'Agregar intervalo'}
          onPress={onAdd}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  day: {
    flex: 1,
    fontSize: TypeScale.title,
    fontWeight: '700',
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
  intervals: {
    gap: Spacing.two,
  },
  interval: {
    gap: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  time: {
    fontSize: TypeScale.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  intervalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  addAction: { alignItems: 'flex-start' },
  closedCopy: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});

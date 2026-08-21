import { StyleSheet, View } from 'react-native';

import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import { getWeekdayLabel, WEEKDAYS_MONDAY_FIRST } from '../booking-domain';
import type { PublicOpeningHour } from '../types';

export function PublicOpeningHours({ hours }: { hours: PublicOpeningHour[] }) {
  return (
    <SurfaceCard style={styles.card}>
      {WEEKDAYS_MONDAY_FIRST.map((weekday) => {
        const dayHours = hours.filter((hour) => hour.weekday === weekday);

        return (
          <View key={weekday} style={styles.row}>
            <ThemedText style={styles.day}>{getWeekdayLabel(weekday)}</ThemedText>
            <View style={styles.intervals}>
              {dayHours.length > 0 ? (
                dayHours.map((hour) => (
                  <ThemedText key={hour.id} style={styles.time} themeColor="textSecondary">
                    {hour.startTime} - {hour.endTime}
                  </ThemedText>
                ))
              ) : (
                <ThemedText style={styles.time} themeColor="textSecondary">
                  Cerrado
                </ThemedText>
              )}
            </View>
          </View>
        );
      })}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  day: {
    width: 96,
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  intervals: {
    flex: 1,
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  time: {
    fontSize: TypeScale.label,
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
    textAlign: 'right',
  },
});

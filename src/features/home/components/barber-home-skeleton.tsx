import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius } from '@/theme/tokens';

export function BarberHomeSkeleton() {
  const theme = useTheme();
  const skeletonColor = theme.surfaceMuted;

  return (
    <View
      accessibilityLabel="Cargando jornada del barbero"
      accessibilityRole="progressbar"
      style={styles.root}
    >
      <View style={[styles.nextAppointment, { backgroundColor: skeletonColor }]} />
      <View style={styles.summaryRow}>
        <View style={[styles.summary, { backgroundColor: skeletonColor }]} />
        <View style={[styles.summary, { backgroundColor: skeletonColor }]} />
        <View style={[styles.summary, { backgroundColor: skeletonColor }]} />
      </View>
      <View style={[styles.list, { backgroundColor: skeletonColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.four,
  },
  nextAppointment: {
    height: 286,
    borderRadius: Radius.large,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  summary: {
    height: 92,
    flex: 1,
    borderRadius: Radius.medium,
  },
  list: {
    height: 184,
    borderRadius: Radius.large,
  },
});

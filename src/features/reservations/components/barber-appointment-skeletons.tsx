import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius } from '@/theme/tokens';

function SkeletonBlock({ height }: { height: number }) {
  const theme = useTheme();
  return <View style={[styles.block, { height, backgroundColor: theme.surfaceMuted }]} />;
}

export function BarberAgendaSkeleton() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        accessibilityLabel="Cargando agenda"
        accessibilityRole="progressbar"
        contentContainerStyle={styles.agendaContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        <SkeletonBlock height={76} />
        <SkeletonBlock height={56} />
        <SkeletonBlock height={44} />
        <SkeletonBlock height={214} />
        <SkeletonBlock height={214} />
      </ScrollView>
    </ThemedView>
  );
}

export function BarberAppointmentDetailSkeleton() {
  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        accessibilityLabel="Cargando detalle de la cita"
        accessibilityRole="progressbar"
        contentContainerStyle={styles.detailContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        <SkeletonBlock height={76} />
        <View style={styles.detailColumns}>
          <View style={styles.mainColumn}>
            <SkeletonBlock height={238} />
            <SkeletonBlock height={260} />
          </View>
          <View style={styles.sideColumn}>
            <SkeletonBlock height={194} />
            <SkeletonBlock height={184} />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  agendaContent: {
    width: '100%',
    maxWidth: Layout.feedMaxWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  detailContent: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  detailColumns: { gap: Spacing.four },
  mainColumn: { gap: Spacing.four },
  sideColumn: { gap: Spacing.four },
  block: { width: '100%', borderRadius: Radius.large },
});

import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius } from '@/theme/tokens';

export function AdminHomeSkeleton() {
  const theme = useTheme();
  const backgroundColor = theme.surfaceMuted;

  return (
    <View
      accessibilityLabel="Cargando inicio administrativo"
      accessibilityRole="progressbar"
      style={styles.root}
    >
      <View style={[styles.header, { backgroundColor }]} />
      <View style={[styles.summary, { backgroundColor }]} />
      <View style={[styles.attention, { backgroundColor }]} />
      <View style={[styles.appointments, { backgroundColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.four },
  header: { width: '72%', height: 116, borderRadius: Radius.large },
  summary: { height: 198, borderRadius: Radius.large },
  attention: { height: 96, borderRadius: Radius.large },
  appointments: { height: 264, borderRadius: Radius.large },
});

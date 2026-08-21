import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius } from '@/theme/tokens';

export function ClientHomeSkeleton() {
  const theme = useTheme();
  const skeletonColor = theme.surfaceMuted;

  return (
    <View accessibilityLabel="Cargando inicio" accessibilityRole="progressbar" style={styles.root}>
      <View style={[styles.hero, { backgroundColor: skeletonColor }]} />
      <View style={styles.headingRow}>
        <View style={[styles.heading, { backgroundColor: skeletonColor }]} />
        <View style={[styles.action, { backgroundColor: skeletonColor }]} />
      </View>
      <View style={styles.cards}>
        <View style={[styles.card, { backgroundColor: skeletonColor }]} />
        <View style={[styles.card, { backgroundColor: skeletonColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.four,
  },
  hero: {
    height: 196,
    borderRadius: Radius.large,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    width: 190,
    height: 24,
    borderRadius: Radius.small,
  },
  action: {
    width: 72,
    height: 20,
    borderRadius: Radius.small,
  },
  cards: {
    flexDirection: 'row',
    gap: Spacing.three,
    overflow: 'hidden',
  },
  card: {
    width: 236,
    height: 238,
    borderRadius: Radius.large,
  },
});

import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius } from '@/theme/tokens';

import { SurfaceCard } from './surface-card';
import { ThemedView } from './themed-view';

export function ListScreenSkeleton({ rows = 3 }: { rows?: number }) {
  const theme = useTheme();
  const fill = { backgroundColor: theme.surfaceMuted };

  return (
    <ThemedView accessibilityLabel="Cargando contenido" style={styles.screen}>
      <View style={styles.content}>
        <View style={[styles.eyebrow, fill]} />
        <View style={[styles.title, fill]} />
        <View style={[styles.description, fill]} />
        <View style={styles.list}>
          {Array.from({ length: rows }, (_, index) => (
            <SurfaceCard key={index} style={styles.card}>
              <View style={[styles.rowTitle, fill]} />
              <View style={[styles.rowMeta, fill]} />
              <View style={[styles.rowMetaShort, fill]} />
            </SurfaceCard>
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.feedMaxWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  eyebrow: { width: 96, height: 14, borderRadius: Radius.small },
  title: { width: '52%', height: 32, borderRadius: Radius.small },
  description: { width: '82%', height: 18, borderRadius: Radius.small },
  list: { gap: Spacing.three, paddingTop: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.four },
  rowTitle: { width: '62%', height: 20, borderRadius: Radius.small },
  rowMeta: { width: '76%', height: 16, borderRadius: Radius.small },
  rowMetaShort: { width: '38%', height: 16, borderRadius: Radius.small },
});

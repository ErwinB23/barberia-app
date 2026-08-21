import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius } from '@/theme/tokens';

export function BarberScreenSkeleton({
  variant = 'list',
}: {
  variant?: 'workspace' | 'list' | 'form';
}) {
  const theme = useTheme();
  const rows = variant === 'workspace' ? 4 : variant === 'form' ? 3 : 5;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        accessibilityLabel="Cargando contenido profesional"
        accessibilityRole="progressbar"
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={[styles.context, { backgroundColor: theme.surfaceMuted }]} />
        {variant === 'workspace' ? (
          <View style={[styles.hero, { backgroundColor: theme.surfaceMuted }]} />
        ) : null}
        {Array.from({ length: rows }, (_, index) => (
          <View
            key={index}
            style={[
              styles.row,
              variant === 'form' ? styles.formRow : null,
              { backgroundColor: theme.surfaceMuted },
            ]}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  context: { width: '100%', height: 64, borderRadius: Radius.medium },
  hero: { width: '100%', height: 168, borderRadius: Radius.large },
  row: { width: '100%', height: 76, borderRadius: Radius.large },
  formRow: { height: 96 },
});

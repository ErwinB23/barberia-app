import { ActivityIndicator, StyleSheet } from 'react-native';

import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

export function AuthLoadingScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SurfaceCard accessibilityLabel="Recuperando tu sesión" style={styles.card}>
        <ActivityIndicator color={theme.primary} size="large" />
        <ThemedText style={styles.title}>Preparando tu espacio</ThemedText>
        <ThemedText style={styles.description} themeColor="textSecondary">
          Recuperando tu sesión…
        </ThemedText>
      </SurfaceCard>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
  title: {
    marginTop: Spacing.two,
    fontSize: TypeScale.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: TypeScale.label,
    textAlign: 'center',
  },
});

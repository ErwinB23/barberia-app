import { StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type StatusMessageProps = {
  message: string;
  tone?: 'error' | 'success';
};

export function StatusMessage({ message, tone = 'error' }: StatusMessageProps) {
  const theme = useTheme();
  const color = tone === 'error' ? theme.danger : theme.success;
  const backgroundColor = tone === 'error' ? theme.dangerSurface : theme.successSurface;

  return (
    <ThemedView
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor, borderColor: color }]}
    >
      <ThemedText style={[styles.label, { color }]}>
        {tone === 'error' ? 'Necesitamos tu atención' : 'Todo listo'}
      </ThemedText>
      <ThemedText selectable style={styles.text}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  label: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  text: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});

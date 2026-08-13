import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type SelectionRowProps = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  type?: 'checkbox' | 'radio';
  disabled?: boolean;
};

export function SelectionRow({
  title,
  description,
  selected,
  onPress,
  type = 'radio',
  disabled = false,
}: SelectionRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={type}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected ? theme.surfaceMuted : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && !disabled ? { backgroundColor: theme.surfaceMuted } : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View
        style={[
          styles.indicator,
          type === 'radio' ? styles.radio : null,
          { borderColor: selected ? theme.primary : theme.border },
        ]}
      >
        {selected ? (
          <View style={[styles.selectedDot, { backgroundColor: theme.primary }]} />
        ) : null}
      </View>
      <View style={styles.copy}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {description ? (
          <ThemedText style={styles.description} themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  disabled: { opacity: 0.5 },
  indicator: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 5,
  },
  radio: { borderRadius: Radius.pill },
  selectedDot: { width: 10, height: 10, borderRadius: Radius.pill },
  copy: { flex: 1, gap: Spacing.one },
  title: { fontSize: TypeScale.body, fontWeight: '700' },
  description: { fontSize: TypeScale.label, lineHeight: 20 },
});

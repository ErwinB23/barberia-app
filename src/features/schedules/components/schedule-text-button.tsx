import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type ScheduleTextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
};

export function ScheduleTextButton({
  label,
  onPress,
  disabled = false,
  tone = 'default',
}: ScheduleTextButtonProps) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : theme.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: tone === 'danger' ? theme.danger : theme.border },
        pressed && !disabled ? { backgroundColor: theme.surfaceMuted } : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <ThemedText style={[styles.label, { color }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
});

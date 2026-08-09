import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Radius, TypeScale } from '@/theme/tokens';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function ActionButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
}: ActionButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || isLoading;
  const palette = {
    primary: {
      backgroundColor: theme.primary,
      pressedBackgroundColor: theme.primaryPressed,
      borderColor: theme.primary,
      color: theme.onPrimary,
    },
    secondary: {
      backgroundColor: theme.surface,
      pressedBackgroundColor: theme.surfaceMuted,
      borderColor: theme.border,
      color: theme.text,
    },
    danger: {
      backgroundColor: theme.dangerSurface,
      pressedBackgroundColor: theme.surfaceMuted,
      borderColor: theme.danger,
      color: theme.danger,
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? { backgroundColor: palette.pressedBackgroundColor } : null,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={palette.color} />
      ) : (
        <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
});

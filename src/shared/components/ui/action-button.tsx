import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { useTheme } from '@/theme/hooks/use-theme';
import { Opacity, Radius, TypeScale } from '@/theme/tokens';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'default' | 'compact';
};

export function ActionButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  size = 'default',
}: ActionButtonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
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
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled }}
      disabled={isDisabled}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'compact' ? styles.compactButton : null,
        { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor },
        isFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? { backgroundColor: palette.pressedBackgroundColor } : null,
        getPressedScaleStyle(pressed && !isDisabled, reduceMotion, 0.985),
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
    opacity: Opacity.disabled,
  },
  compactButton: {
    minHeight: 48,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
});

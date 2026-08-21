import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Radius, TypeScale } from '@/theme/tokens';

type IconButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel: string;
  badgeCount?: number;
  icon: Parameters<typeof AppIcon>[0]['name'];
  onPress: () => void;
};

export function IconButton({
  accessibilityHint,
  accessibilityLabel,
  badgeCount = 0,
  icon,
  onPress,
}: IconButtonProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const visibleBadge = badgeCount > 99 ? '99+' : String(badgeCount);

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.96),
      ]}
    >
      <AppIcon color={theme.text} name={icon} size={22} />
      {badgeCount > 0 ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.badge, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={[styles.badgeLabel, { color: theme.onPrimary }]}>
            {visibleBadge}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  badge: {
    minWidth: 18,
    height: 18,
    position: 'absolute',
    top: 2,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
  },
  badgeLabel: {
    fontSize: TypeScale.caption - 3,
    fontWeight: '800',
    lineHeight: 14,
  },
});

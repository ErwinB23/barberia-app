import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

export function BarberContextBanner({
  barbershopName,
  onOpenWorkspace,
}: {
  barbershopName: string | null;
  onOpenWorkspace?: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon
          color={theme.primary}
          name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
          size={20}
        />
      </View>
      <View style={styles.copy}>
        <ThemedText style={styles.label} themeColor="textSecondary">
          Espacio profesional
        </ThemedText>
        <ThemedText selectable style={styles.name}>
          {barbershopName ?? 'Barbería actual'}
        </ThemedText>
      </View>
      {onOpenWorkspace ? (
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
        />
      ) : null}
    </>
  );

  if (!onOpenWorkspace) {
    return <View style={[styles.banner, { borderColor: theme.border }]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityHint="Vuelve a Mi espacio de barbero"
      accessibilityLabel={`Espacio profesional en ${barbershopName ?? 'la barbería actual'}`}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onOpenWorkspace}
      style={({ pressed }) => [
        styles.banner,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.99),
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  copy: { minWidth: 0, flex: 1, gap: Spacing.one },
  label: { fontSize: TypeScale.caption, lineHeight: 17 },
  name: { fontSize: TypeScale.body, fontWeight: '700', lineHeight: 22 },
});

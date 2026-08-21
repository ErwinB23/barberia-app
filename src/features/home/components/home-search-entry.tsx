import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

export function HomeSearchEntry() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <Pressable
      accessibilityHint="Abre el listado de barberías disponibles"
      accessibilityLabel="Buscar barberías"
      accessibilityRole="button"
      onPress={() => router.push('/explore')}
      style={({ pressed }) => [
        styles.search,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.99),
      ]}
    >
      <View style={styles.labelGroup}>
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={21}
        />
        <ThemedText style={styles.label} themeColor="textSecondary">
          Buscar barberías
        </ThemedText>
      </View>
      <AppIcon
        color={theme.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  labelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  label: {
    fontSize: TypeScale.body,
  },
});

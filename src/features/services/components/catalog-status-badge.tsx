import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getCatalogStatusLabel } from '../formatters';

export function CatalogStatusBadge({ isActive }: { isActive: boolean }) {
  const theme = useTheme();
  const color = isActive ? theme.success : theme.textSecondary;
  const backgroundColor = isActive ? theme.successSurface : theme.surfaceMuted;

  return (
    <View
      accessibilityLabel={`Estado: ${getCatalogStatusLabel(isActive)}`}
      style={[styles.badge, { backgroundColor, borderColor: color }]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText style={[styles.label, { color }]}>{getCatalogStatusLabel(isActive)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
});

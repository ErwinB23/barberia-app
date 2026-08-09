import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getBarbershopStatusLabel } from '../mappers';
import type { BarbershopStatus } from '../types';

export function BarbershopStatusBadge({ status }: { status: BarbershopStatus }) {
  const theme = useTheme();
  const palette = {
    published: { color: theme.success, backgroundColor: theme.successSurface },
    paused: { color: theme.warning, backgroundColor: theme.warningSurface },
    unpublished: { color: theme.primary, backgroundColor: theme.surfaceMuted },
  }[status];

  return (
    <View
      accessibilityLabel={`Estado: ${getBarbershopStatusLabel(status)}`}
      style={[styles.badge, { backgroundColor: palette.backgroundColor }]}
    >
      <View style={[styles.dot, { backgroundColor: palette.color }]} />
      <ThemedText style={[styles.label, { color: palette.color }]}>
        {getBarbershopStatusLabel(status)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 32,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
});

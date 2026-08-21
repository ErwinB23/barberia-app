import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

export function ExploreEmptyState({
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.empty, { backgroundColor: theme.surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon
          color={theme.primary}
          name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
          size={28}
        />
      </View>
      <View style={styles.emptyCopy}>
        <ThemedText accessibilityRole="header" style={styles.emptyTitle}>
          {title}
        </ThemedText>
        <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

export function ExploreListSkeleton({ isWide }: { isWide: boolean }) {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Cargando barberías"
      style={isWide ? styles.skeletonGrid : styles.skeletonList}
    >
      {[0, 1, 2, 3].map((item) => (
        <View
          key={item}
          style={[
            styles.skeletonCard,
            isWide ? styles.skeletonWideCard : null,
            { backgroundColor: theme.surface },
          ]}
        >
          <View style={[styles.skeletonImage, { backgroundColor: theme.surfaceMuted }]} />
          <View style={styles.skeletonCopy}>
            <View style={[styles.skeletonShort, { backgroundColor: theme.surfaceMuted }]} />
            <View style={[styles.skeletonTitle, { backgroundColor: theme.surfaceMuted }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceMuted }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.surfaceMuted }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  emptyCopy: {
    gap: Spacing.one,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  emptyDescription: {
    maxWidth: 520,
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  skeletonList: {
    gap: Spacing.three,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  skeletonCard: {
    overflow: 'hidden',
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  skeletonWideCard: {
    minWidth: 320,
    flexBasis: 420,
    flexGrow: 1,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 16 / 8.5,
  },
  skeletonCopy: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  skeletonShort: {
    width: 132,
    height: 14,
    borderRadius: Radius.small,
  },
  skeletonTitle: {
    width: '66%',
    height: 24,
    borderRadius: Radius.small,
  },
  skeletonLine: {
    width: '100%',
    height: 16,
    borderRadius: Radius.small,
  },
});

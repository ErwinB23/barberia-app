import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type ProfileNavigationRowProps = {
  accessibilityHint?: string;
  badgeCount?: number;
  description?: string;
  icon: Parameters<typeof AppIcon>[0]['name'];
  isLast?: boolean;
  isLoading?: boolean;
  onPress: () => void;
  showsChevron?: boolean;
  title: string;
  tone?: 'default' | 'danger';
};

export function ProfileNavigationRow({
  accessibilityHint,
  badgeCount = 0,
  description,
  icon,
  isLast = false,
  isLoading = false,
  onPress,
  showsChevron = true,
  title,
  tone = 'default',
}: ProfileNavigationRowProps) {
  const theme = useTheme();
  const foreground = tone === 'danger' ? theme.danger : theme.text;
  const visibleBadge = badgeCount > 99 ? '99+' : String(badgeCount);

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={badgeCount > 0 ? `${title}, ${visibleBadge} sin leer` : title}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast ? { borderBottomColor: theme.border, borderBottomWidth: 1 } : null,
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      <View style={[styles.iconShell, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon color={foreground} name={icon} size={21} />
      </View>
      <View style={styles.copy}>
        <ThemedText style={[styles.title, { color: foreground }]}>{title}</ThemedText>
        {description ? (
          <ThemedText style={styles.description} themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      {badgeCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <ThemedText style={[styles.badgeLabel, { color: theme.onPrimary }]}>
            {visibleBadge}
          </ThemedText>
        </View>
      ) : null}
      {isLoading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : showsChevron ? (
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconShell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  description: {
    fontSize: TypeScale.caption,
    lineHeight: 18,
  },
  badge: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
  },
  badgeLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});

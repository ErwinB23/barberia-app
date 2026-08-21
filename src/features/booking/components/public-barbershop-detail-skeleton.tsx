import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius } from '@/theme/tokens';

export function PublicBarbershopDetailSkeleton({
  isCompact,
  isWide,
}: {
  isCompact: boolean;
  isWide: boolean;
}) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        accessibilityLabel="Cargando información de la barbería"
        contentContainerStyle={[styles.content, isCompact ? styles.compactContent : null]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={[styles.hero, isWide ? styles.heroWide : null]}>
          <View
            style={[
              styles.heroMedia,
              isWide ? styles.heroMediaWide : null,
              { backgroundColor: theme.surfaceMuted },
            ]}
          />
          <View style={[styles.heroCopy, isWide ? styles.heroCopyWide : null]}>
            <SkeletonLine width="34%" />
            <SkeletonLine height={34} width="82%" />
            <SkeletonLine width="100%" />
            <SkeletonLine width="72%" />
            <SkeletonLine height={52} width="100%" />
          </View>
        </View>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.section}>
            <SkeletonLine height={28} width="36%" />
            <SkeletonLine width="62%" />
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <SkeletonLine height={24} width="52%" />
              <SkeletonLine width="100%" />
              <SkeletonLine width="74%" />
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

function SkeletonLine({ height = 16, width }: { height?: number; width: `${number}%` }) {
  const theme = useTheme();

  return <View style={[styles.line, { backgroundColor: theme.surfaceMuted, height, width }]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.six,
    padding: Spacing.five,
    paddingBottom: Spacing.seven,
  },
  compactContent: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    paddingBottom: Spacing.six,
  },
  hero: {
    gap: Spacing.four,
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.five,
  },
  heroMedia: {
    minWidth: 0,
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  heroMediaWide: {
    width: 'auto',
    flex: 1.15,
  },
  heroCopy: {
    minWidth: 0,
    width: '100%',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  heroCopyWide: {
    width: 'auto',
    flex: 0.85,
  },
  section: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  line: {
    borderRadius: Radius.small,
  },
});

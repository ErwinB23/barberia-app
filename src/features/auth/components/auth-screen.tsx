import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function AuthScreen({ title, description, children }: AuthScreenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < Layout.compactBreakpoint;
  const isWide = width >= Layout.wideBreakpoint;

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={72}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            isCompact ? styles.contentCompact : null,
            isWide ? styles.contentWide : null,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.intro, isWide ? styles.introWide : null]}>
            <View style={styles.brand}>
              <View style={[styles.brandMark, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.brandInitial, { color: theme.onPrimary }]}>B</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.brandName}>Barbería App</ThemedText>
                <ThemedText style={styles.brandCaption} themeColor="textSecondary">
                  Cuidado personal, bien organizado
                </ThemedText>
              </View>
            </View>
            <ScreenHeading
              compact={isCompact}
              description={description}
              eyebrow="Tu barbería, en un solo lugar"
              title={title}
            />
          </View>
          <SurfaceCard style={[styles.card, isWide ? styles.cardWide : null]}>
            {children}
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  contentCompact: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
  contentWide: {
    flexDirection: 'row',
    gap: Spacing.seven,
    maxWidth: Layout.authMaxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: Spacing.six,
  },
  intro: {
    width: '100%',
    maxWidth: Layout.formMaxWidth,
    gap: Spacing.five,
  },
  introWide: {
    flex: 1,
    maxWidth: 440,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  brandMark: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  brandInitial: {
    fontSize: TypeScale.title,
    fontWeight: '800',
  },
  brandName: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  brandCaption: {
    fontSize: TypeScale.caption,
  },
  card: {
    width: '100%',
    maxWidth: Layout.formMaxWidth,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  cardWide: {
    flex: 1,
  },
});

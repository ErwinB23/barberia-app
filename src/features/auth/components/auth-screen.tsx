import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  description: string;
  variant?: 'form' | 'status';
}>;

export function AuthScreen({ title, description, variant = 'form', children }: AuthScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < Layout.compactBreakpoint;
  const isWide = width >= Layout.wideBreakpoint;
  const isStatus = variant === 'status';
  const bottomPadding =
    process.env.EXPO_OS === 'android'
      ? Math.max(Spacing.four, insets.bottom + Spacing.three)
      : Spacing.five;

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={72}
        style={styles.screen}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            styles.content,
            isCompact ? styles.contentCompact : null,
            isWide && !isStatus ? styles.contentWide : null,
            isStatus ? styles.statusContent : null,
            { paddingBottom: bottomPadding },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode={process.env.EXPO_OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
          {!isStatus ? (
            <View style={[styles.intro, isWide ? styles.introWide : null]}>
              <ThemedText accessibilityRole="header" style={styles.brandName}>
                Barbería{' '}
                <ThemedText style={[styles.brandApp, { color: theme.primary }]}>App</ThemedText>
              </ThemedText>
              <View style={[styles.brandAccent, { backgroundColor: theme.primary }]} />
              {isWide ? (
                <>
                  <ThemedText style={styles.brandPromise}>
                    Tu barbería, tus citas, todo en un solo lugar.
                  </ThemedText>
                  <ThemedText style={styles.brandDescription} themeColor="textSecondary">
                    Una experiencia clara para reservar, trabajar y administrar cada día.
                  </ThemedText>
                </>
              ) : null}
            </View>
          ) : null}
          <SurfaceCard
            elevated={isWide && !isStatus}
            style={[
              styles.card,
              isWide && !isStatus ? styles.cardWide : null,
              isCompact && !isStatus
                ? {
                    backgroundColor: theme.background,
                    borderColor: 'transparent',
                  }
                : null,
              isCompact && !isStatus ? styles.cardCompact : null,
              isStatus ? styles.statusCard : null,
              isCompact && isStatus ? styles.statusCardCompact : null,
            ]}
          >
            <View style={styles.heading}>
              <ThemedText accessibilityRole="header" style={styles.title}>
                {title}
              </ThemedText>
              <ThemedText style={styles.description} themeColor="textSecondary">
                {description}
              </ThemedText>
            </View>
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
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  contentCompact: {
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  contentWide: {
    flexDirection: 'row',
    gap: Spacing.six,
    maxWidth: Layout.authMaxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: Spacing.six,
  },
  statusContent: {
    width: '100%',
    alignSelf: 'center',
  },
  intro: {
    width: '100%',
    maxWidth: Layout.formMaxWidth,
    gap: Spacing.three,
  },
  introWide: {
    flex: 1,
    maxWidth: 440,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  brandName: {
    flexShrink: 1,
    fontSize: TypeScale.title,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandApp: {
    fontWeight: '800',
  },
  brandAccent: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  brandPromise: {
    maxWidth: 420,
    fontSize: TypeScale.display,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandDescription: {
    maxWidth: 390,
    fontSize: TypeScale.body,
  },
  card: {
    width: '100%',
    maxWidth: Layout.formMaxWidth,
    gap: Spacing.four,
    padding: Spacing.four,
  },
  cardWide: {
    flex: 1,
    padding: Spacing.five,
  },
  cardCompact: {
    borderWidth: 0,
    padding: 0,
  },
  statusCard: {
    maxWidth: 480,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  statusCardCompact: {
    padding: Spacing.four,
  },
  heading: {
    gap: Spacing.two,
  },
  title: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  description: {
    maxWidth: 440,
    fontSize: TypeScale.body,
  },
});

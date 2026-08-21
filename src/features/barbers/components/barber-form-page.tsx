import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout } from '@/theme/tokens';

import { BarberContextBanner } from './barber-context-banner';

export function BarberFormPage({
  barbershopName,
  description,
  intro,
  title,
  children,
}: PropsWithChildren<{
  barbershopName: string | null;
  description: string;
  intro?: ReactNode;
  title?: string;
}>) {
  const { width } = useWindowDimensions();
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
            !title ? styles.ownContent : null,
            width < Layout.compactBreakpoint ? styles.compact : null,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          {title ? (
            <ScreenHeading description={description} title={title} />
          ) : (
            <View style={styles.intro}>
              <BarberContextBanner barbershopName={barbershopName} />
              <ThemedText style={styles.description} themeColor="textSecondary">
                {description}
              </ThemedText>
            </View>
          )}
          {intro}
          <SurfaceCard
            style={[
              styles.card,
              !title && width < Layout.compactBreakpoint ? styles.compactOwnCard : null,
            ]}
          >
            {children}
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.five,
    padding: Spacing.five,
    paddingVertical: Spacing.six,
  },
  ownContent: { maxWidth: Layout.formMaxWidth },
  compact: { gap: Spacing.four, padding: Spacing.three, paddingVertical: Spacing.four },
  intro: { gap: Spacing.three },
  description: { maxWidth: 620, lineHeight: 24 },
  card: { gap: Spacing.four, padding: Spacing.five },
  compactOwnCard: { gap: Spacing.three, padding: Spacing.four },
});

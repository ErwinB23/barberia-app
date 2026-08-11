import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout } from '@/theme/tokens';

type ScheduleFormPageProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function ScheduleFormPage({ title, description, children }: ScheduleFormPageProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < Layout.compactBreakpoint;

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={72}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={[styles.content, isCompact ? styles.compactContent : null]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeading compact={isCompact} description={description} title={title} />
          <SurfaceCard style={styles.card}>{children}</SurfaceCard>
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
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.five,
    padding: Spacing.five,
    paddingVertical: Spacing.six,
  },
  compactContent: {
    gap: Spacing.four,
    padding: Spacing.three,
    paddingVertical: Spacing.four,
  },
  card: {
    gap: Spacing.four,
    padding: Spacing.five,
  },
});

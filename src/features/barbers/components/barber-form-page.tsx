import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout } from '@/theme/tokens';

export function BarberFormPage({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description: string }>) {
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
            width < Layout.compactBreakpoint ? styles.compact : null,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeading description={description} title={title} />
          <SurfaceCard style={styles.card}>{children}</SurfaceCard>
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
  compact: { gap: Spacing.four, padding: Spacing.three, paddingVertical: Spacing.four },
  card: { gap: Spacing.four, padding: Spacing.five },
});

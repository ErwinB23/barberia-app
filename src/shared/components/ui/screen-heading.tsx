import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

type ScreenHeadingProps = {
  eyebrow?: string;
  title: string;
  description: string;
  compact?: boolean;
};

export function ScreenHeading({
  eyebrow,
  title,
  description,
  compact = false,
}: ScreenHeadingProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <ThemedText style={styles.eyebrow} themeColor="primary">
          {eyebrow.toUpperCase()}
        </ThemedText>
      ) : null}
      <ThemedText style={[styles.title, compact ? styles.compactTitle : null]}>{title}</ThemedText>
      <ThemedText style={styles.description} themeColor="textSecondary">
        {description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    maxWidth: 560,
    fontSize: TypeScale.display,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  compactTitle: {
    fontSize: TypeScale.headline,
    lineHeight: 36,
  },
  description: {
    maxWidth: 560,
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
});

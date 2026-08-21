import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

export function BookingStepHeading({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.description} themeColor="textSecondary">
        {description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  title: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  description: {
    maxWidth: 620,
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
});

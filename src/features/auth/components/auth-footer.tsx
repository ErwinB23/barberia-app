import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type AuthFooterProps = {
  prompt: string;
  label: string;
  href: Href;
};

export function AuthFooter({ prompt, label, href }: AuthFooterProps) {
  const theme = useTheme();

  return (
    <View style={styles.footer}>
      <ThemedText style={styles.prompt} themeColor="textSecondary">
        {prompt}
      </ThemedText>
      <Link asChild href={href}>
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [
            styles.link,
            { backgroundColor: theme.surfaceMuted },
            pressed ? styles.pressed : null,
          ]}
        >
          <ThemedText style={styles.linkLabel} themeColor="primary">
            {label}
          </ThemedText>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  prompt: {
    fontSize: TypeScale.label,
    textAlign: 'center',
  },
  link: {
    minHeight: 44,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.72,
  },
  linkLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
    textAlign: 'center',
  },
});

import { useState } from 'react';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type AuthFooterProps = {
  prompt?: string;
  label: string;
  href: Href;
  align?: 'center' | 'end';
};

export function AuthFooter({ prompt, label, href, align = 'center' }: AuthFooterProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.footer, align === 'end' ? styles.footerEnd : null]}>
      {prompt ? (
        <ThemedText style={styles.prompt} themeColor="textSecondary">
          {prompt}
        </ThemedText>
      ) : null}
      <Link asChild href={href}>
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="link"
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          style={({ pressed }) => [
            styles.link,
            isFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
            pressed ? styles.pressed : null,
            getPressedScaleStyle(pressed, reduceMotion, 0.97),
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
    minHeight: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: Spacing.one,
  },
  footerEnd: { alignSelf: 'flex-end' },
  prompt: {
    fontSize: TypeScale.label,
    textAlign: 'center',
  },
  link: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.one,
  },
  pressed: {
    opacity: 0.72,
  },
  linkLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

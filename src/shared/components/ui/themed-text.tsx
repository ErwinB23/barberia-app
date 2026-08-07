import { Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/theme/colors';
import { useTheme } from '@/theme/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  themeColor?: ThemeColor;
};

export function ThemedText({ style, themeColor = 'text', ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor] }, style]} {...rest} />;
}

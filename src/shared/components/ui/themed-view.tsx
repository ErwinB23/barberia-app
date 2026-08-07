import { View, type ViewProps } from 'react-native';

import type { ThemeColor } from '@/theme/colors';
import { useTheme } from '@/theme/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  themeColor?: ThemeColor;
};

export function ThemedView({ style, themeColor = 'background', ...rest }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[themeColor] }, style]} {...rest} />;
}

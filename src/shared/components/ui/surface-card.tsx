import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Radius } from '@/theme/tokens';

export function SurfaceCard({ style, ...props }: ViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          boxShadow: `0 12px 32px ${theme.cardShadow}`,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
});

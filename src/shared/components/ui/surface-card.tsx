import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Radius } from '@/theme/tokens';

type SurfaceCardProps = ViewProps & {
  elevated?: boolean;
};

export function SurfaceCard({ elevated = false, style, ...props }: SurfaceCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          boxShadow: elevated ? `0 8px 24px ${theme.cardShadow}` : undefined,
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

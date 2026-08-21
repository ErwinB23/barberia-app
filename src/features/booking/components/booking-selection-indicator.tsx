import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { useTheme } from '@/theme/hooks/use-theme';
import { Motion, Radius } from '@/theme/tokens';

export function BookingSelectionIndicator({
  selected,
  type = 'radio',
}: {
  selected: boolean;
  type?: 'checkbox' | 'radio';
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.indicator,
        type === 'radio' ? styles.radio : null,
        {
          backgroundColor: selected ? theme.primary : 'transparent',
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      {selected ? (
        <Animated.View entering={FadeIn.duration(Motion.press).reduceMotion(ReduceMotion.System)}>
          <AppIcon
            color={theme.onPrimary}
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={14}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  indicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 7,
  },
  radio: {
    borderRadius: Radius.pill,
  },
});

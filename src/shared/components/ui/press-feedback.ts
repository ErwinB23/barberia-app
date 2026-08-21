import type { ViewStyle } from 'react-native';

export function getPressedScaleStyle(
  pressed: boolean,
  reduceMotion: boolean,
  scale: number,
): ViewStyle | null {
  if (!pressed || reduceMotion) return null;

  return { transform: [{ scale }] };
}

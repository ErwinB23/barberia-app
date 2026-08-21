import type { ComponentProps } from 'react';
import { SymbolView } from 'expo-symbols';

type AppIconProps = {
  color: string;
  name: ComponentProps<typeof SymbolView>['name'];
  size?: number;
};

export function AppIcon({ color, name, size = 22 }: AppIconProps) {
  return (
    <SymbolView
      accessible={false}
      name={name}
      resizeMode="scaleAspectFit"
      size={size}
      style={{ height: size, width: size }}
      tintColor={color}
    />
  );
}

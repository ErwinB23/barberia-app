import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Radius, TypeScale } from '@/theme/tokens';

import { isSafeRemoteImageUrl } from '../barber-domain';

export function BarberAvatar({
  displayName,
  photoUrl,
  size = 72,
}: {
  displayName: string;
  photoUrl: string | null;
  size?: number;
}) {
  const theme = useTheme();
  const initial = displayName.trim().charAt(0).toUpperCase() || 'B';
  const hasImage = isSafeRemoteImageUrl(photoUrl);

  return (
    <View
      accessibilityLabel={hasImage ? `Foto de ${displayName}` : `Inicial de ${displayName}`}
      accessibilityRole="image"
      style={[styles.avatar, { width: size, height: size, backgroundColor: theme.surfaceMuted }]}
    >
      <ThemedText
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.initial}
        themeColor="primary"
      >
        {initial}
      </ThemedText>
      {hasImage ? (
        <Image
          accessibilityElementsHidden
          cachePolicy="memory-disk"
          contentFit="cover"
          importantForAccessibility="no-hide-descendants"
          source={{ uri: photoUrl! }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  initial: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
  },
});

import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Radius, TypeScale } from '@/theme/tokens';

import { isSafeProfileImageUrl } from '../profile-domain';

type ProfileAvatarProps = {
  avatarUrl: string | null;
  displayName: string;
};

export function ProfileAvatar({ avatarUrl, displayName }: ProfileAvatarProps) {
  const theme = useTheme();
  const initial = displayName.trim().charAt(0).toUpperCase() || 'B';
  const showImage = isSafeProfileImageUrl(avatarUrl);

  return (
    <View
      accessibilityLabel={
        showImage ? `Foto de perfil de ${displayName}` : `Inicial de ${displayName}`
      }
      accessibilityRole="image"
      style={[styles.avatar, { backgroundColor: theme.surfaceMuted }]}
    >
      <ThemedText
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.initial}
        themeColor="primary"
      >
        {initial}
      </ThemedText>
      {showImage ? (
        <Image
          accessibilityElementsHidden
          contentFit="cover"
          importantForAccessibility="no-hide-descendants"
          source={{ uri: avatarUrl! }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
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

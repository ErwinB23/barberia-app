import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type HomeBarbershopCardProps = {
  barbershop: {
    id: string;
    name: string;
    logoUrl: string | null;
    address: string | null;
  };
  isPrimary?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function HomeBarbershopCard({
  barbershop,
  isPrimary = false,
  style,
}: HomeBarbershopCardProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const showLogo = barbershop.logoUrl?.startsWith('https://');

  return (
    <Pressable
      accessibilityHint="Abre el detalle de la barbería"
      accessibilityLabel={`${barbershop.name}${isPrimary ? ', favorita principal' : ''}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/explore/[barbershopId]',
          params: { barbershopId: barbershop.id },
        })
      }
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.985),
        style,
      ]}
    >
      {showLogo ? (
        <Image
          accessible={false}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={barbershop.id}
          source={{ uri: barbershop.logoUrl! }}
          style={styles.image}
          transition={180}
        />
      ) : (
        <View style={[styles.imageFallback, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            size={30}
          />
        </View>
      )}

      <View style={styles.copy}>
        {isPrimary ? (
          <View style={[styles.primaryBadge, { backgroundColor: theme.surfaceMuted }]}>
            <AppIcon
              color={theme.primary}
              name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
              size={13}
            />
            <ThemedText style={styles.primaryLabel} themeColor="primary">
              Principal
            </ThemedText>
          </View>
        ) : null}
        <ThemedText numberOfLines={2} style={styles.name}>
          {barbershop.name}
        </ThemedText>
        {barbershop.address ? (
          <View style={styles.addressRow}>
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
              size={16}
            />
            <ThemedText numberOfLines={1} style={styles.address} themeColor="textSecondary">
              {barbershop.address}
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={styles.address} themeColor="textSecondary">
            Consulta sus servicios y horarios
          </ThemedText>
        )}
        <View style={styles.linkRow}>
          <ThemedText style={styles.linkLabel} themeColor="primary">
            Ver barbería
          </ThemedText>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={15}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 236,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 8.5,
  },
  imageFallback: {
    width: '100%',
    aspectRatio: 16 / 8.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    minHeight: 128,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  primaryBadge: {
    minHeight: 26,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
  },
  primaryLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  name: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  address: {
    flex: 1,
    fontSize: TypeScale.caption,
    lineHeight: 18,
  },
  linkRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 'auto',
  },
  linkLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
});

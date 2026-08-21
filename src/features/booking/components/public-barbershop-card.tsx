import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import type { FavoriteStatus } from '@/features/favorites/types';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Motion, Radius, TypeScale } from '@/theme/tokens';

import type { PublicBarbershop } from '../types';

type PublicBarbershopCardProps = {
  barbershop: PublicBarbershop;
  favorite: FavoriteStatus | null;
  favoriteUnavailable: boolean;
  isFavoriteLoading: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PublicBarbershopCard({
  barbershop,
  favorite,
  favoriteUnavailable,
  isFavoriteLoading,
  onOpen,
  onToggleFavorite,
  style,
}: PublicBarbershopCardProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const showLogo = barbershop.logoUrl?.startsWith('https://');
  const isPaused = barbershop.status === 'paused';
  const favoriteLabel = favorite
    ? `Quitar ${barbershop.name} de favoritas`
    : `Agregar ${barbershop.name} a favoritas`;

  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}
    >
      <Pressable
        accessibilityHint="Abre sus servicios, profesionales y horarios"
        accessibilityLabel={`Ver ${barbershop.name}`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.openArea, pressed ? styles.pressed : null]}
      >
        {showLogo ? (
          <Image
            accessible={false}
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={barbershop.id}
            source={{ uri: barbershop.logoUrl! }}
            style={[styles.image, { backgroundColor: theme.surfaceMuted }]}
            transition={180}
          />
        ) : (
          <View style={[styles.image, styles.fallback, { backgroundColor: theme.surfaceMuted }]}>
            <AppIcon
              color={theme.primary}
              name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
              size={36}
            />
          </View>
        )}

        <View style={styles.copy}>
          <View style={styles.statusRow}>
            <AppIcon
              color={isPaused ? theme.warning : theme.success}
              name={
                isPaused
                  ? { ios: 'pause.circle', android: 'pause_circle', web: 'pause_circle' }
                  : { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }
              }
              size={16}
            />
            <ThemedText
              style={[styles.status, { color: isPaused ? theme.warning : theme.success }]}
            >
              {isPaused ? 'Reservas pausadas' : 'Disponible para reservar'}
            </ThemedText>
          </View>

          <View style={styles.nameRow}>
            <ThemedText numberOfLines={2} style={styles.name}>
              {barbershop.name}
            </ThemedText>
            {favorite?.isPrimary ? (
              <View
                accessibilityLabel="Favorita principal"
                accessibilityRole="text"
                style={[styles.primaryBadge, { backgroundColor: theme.surfaceMuted }]}
              >
                <AppIcon
                  color={theme.primary}
                  name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                  size={13}
                />
                <ThemedText style={styles.primaryLabel} themeColor="primary">
                  Principal
                </ThemedText>
              </View>
            ) : null}
          </View>

          {barbershop.description ? (
            <ThemedText numberOfLines={2} style={styles.description} themeColor="textSecondary">
              {barbershop.description}
            </ThemedText>
          ) : null}

          <View style={styles.addressRow}>
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
              size={17}
            />
            <ThemedText numberOfLines={2} style={styles.address} themeColor="textSecondary">
              {barbershop.address ?? 'Consulta la ubicación en el detalle'}
            </ThemedText>
          </View>

          <View style={styles.linkRow}>
            <ThemedText style={styles.link} themeColor="primary">
              Ver barbería
            </ThemedText>
            <AppIcon
              color={theme.primary}
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={16}
            />
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel={favoriteUnavailable ? 'Favoritos no disponibles' : favoriteLabel}
        accessibilityRole="button"
        accessibilityState={{
          busy: isFavoriteLoading,
          disabled: favoriteUnavailable || isFavoriteLoading,
          selected: Boolean(favorite),
        }}
        disabled={favoriteUnavailable || isFavoriteLoading}
        hitSlop={8}
        onPress={onToggleFavorite}
        style={({ pressed }) => [
          styles.favoriteButton,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
            borderColor: theme.border,
          },
          getPressedScaleStyle(pressed, reduceMotion, 0.94),
          favoriteUnavailable ? styles.disabled : null,
        ]}
      >
        {isFavoriteLoading ? (
          <ActivityIndicator color={theme.primary} size="small" />
        ) : (
          <Animated.View
            entering={FadeIn.duration(Motion.press).reduceMotion(ReduceMotion.System)}
            key={favorite ? 'favorite' : 'not-favorite'}
          >
            <AppIcon
              color={favorite ? theme.primary : theme.text}
              name={
                favorite
                  ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                  : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
              }
              size={22}
            />
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  openArea: {
    flex: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 8.5,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  statusRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  status: {
    flex: 1,
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  primaryBadge: {
    minHeight: 28,
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
  description: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  address: {
    flex: 1,
    fontSize: TypeScale.label,
    lineHeight: 20,
  },
  linkRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingTop: Spacing.one,
  },
  link: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 48,
    height: 48,
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
    zIndex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

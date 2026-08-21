import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Motion, Radius, TypeScale } from '@/theme/tokens';

import { addFavorite, changePrimaryFavorite, removeFavorite } from '../actions';
import { getFavoriteErrorMessage } from '../errors';
import { getFavoriteStatus } from '../queries';
import type { FavoriteStatus } from '../types';

export function FavoriteBarbershopControls({ barbershopId }: { barbershopId: string }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [favorite, setFavorite] = useState<FavoriteStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadError(null);
    try {
      setFavorite(await getFavoriteStatus(user.id, barbershopId));
    } catch (error) {
      setLoadError(getFavoriteErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const run = async (
    operation: () => Promise<void>,
    successMessage: string,
    optimisticValue?: FavoriteStatus | null,
  ) => {
    const previousFavorite = favorite;
    setIsMutating(true);
    setOperationError(null);
    setFeedback(null);
    if (optimisticValue !== undefined) setFavorite(optimisticValue);

    try {
      await operation();
      setFeedback(successMessage);
      await load();
    } catch (error) {
      setFavorite(previousFavorite);
      setOperationError(getFavoriteErrorMessage(error));
    } finally {
      setIsMutating(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <View accessibilityLabel="Cargando estado de favorita" style={styles.loadingRow}>
        <ActivityIndicator color={theme.primary} size="small" />
        <ThemedText style={styles.helper} themeColor="textSecondary">
          Consultando tus favoritas
        </ThemedText>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.messageGroup}>
        <ThemedText accessibilityRole="alert" style={styles.helper} themeColor="textSecondary">
          No pudimos consultar tus favoritas. La información de la barbería sigue disponible.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => void load()}
          style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}
        >
          <ThemedText style={styles.retryLabel} themeColor="primary">
            Reintentar
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <FavoriteControl
          accessibilityLabel={favorite ? 'Quitar de favoritas' : 'Agregar a favoritas'}
          icon={
            favorite
              ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
              : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
          }
          isLoading={isMutating}
          label={favorite ? 'Guardada' : 'Guardar'}
          onPress={() =>
            favorite
              ? void run(
                  () => removeFavorite(user.id, favorite.id),
                  'Barbería eliminada de favoritas.',
                  null,
                )
              : void run(() => addFavorite(user.id, barbershopId), 'Barbería agregada a favoritas.')
          }
          selected={Boolean(favorite)}
        />

        {favorite ? (
          <FavoriteControl
            accessibilityLabel={
              favorite.isPrimary ? 'Quitar como favorita principal' : 'Establecer como principal'
            }
            icon={
              favorite.isPrimary
                ? { ios: 'star.fill', android: 'star', web: 'star' }
                : { ios: 'star', android: 'star_border', web: 'star_border' }
            }
            disabled={isMutating}
            label={favorite.isPrimary ? 'Principal' : 'Hacer principal'}
            onPress={() =>
              void run(
                () => changePrimaryFavorite(user.id, favorite.isPrimary ? null : favorite.id),
                favorite.isPrimary
                  ? 'Ya no tienes una barbería principal.'
                  : 'Barbería establecida como principal.',
                { ...favorite, isPrimary: !favorite.isPrimary },
              )
            }
            selected={favorite.isPrimary}
          />
        ) : null}
      </View>

      {feedback ? (
        <ThemedText accessibilityLiveRegion="polite" style={styles.feedback} themeColor="success">
          {feedback}
        </ThemedText>
      ) : null}
      {operationError ? (
        <ThemedText accessibilityRole="alert" style={styles.feedback} themeColor="danger">
          {operationError}
        </ThemedText>
      ) : null}
    </View>
  );
}

function FavoriteControl({
  accessibilityLabel,
  disabled = false,
  icon,
  isLoading = false,
  label,
  onPress,
  selected,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: Parameters<typeof AppIcon>[0]['name'];
  isLoading?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: isDisabled, selected }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        {
          backgroundColor: selected ? theme.surfaceMuted : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed ? styles.pressed : null,
        pressed && !reduceMotion ? styles.pressedScale : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.primary} size="small" />
      ) : (
        <Animated.View
          entering={FadeIn.duration(Motion.press).reduceMotion(ReduceMotion.System)}
          key={selected ? 'selected' : 'idle'}
        >
          <AppIcon color={selected ? theme.primary : theme.text} name={icon} size={20} />
        </Animated.View>
      )}
      <ThemedText style={styles.controlLabel} themeColor={selected ? 'primary' : 'text'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  control: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  controlLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  loadingRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  messageGroup: {
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  helper: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  retryLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  feedback: {
    fontSize: TypeScale.caption,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.72,
  },
  pressedScale: {
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

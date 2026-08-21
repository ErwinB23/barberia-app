import { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { changePrimaryFavorite, removeFavorite } from '../actions';
import { getFavoriteErrorMessage } from '../errors';
import { useFavorites } from '../hooks/use-favorites';
import type { FavoriteBarbershop } from '../types';

type FavoriteCardProps = {
  favorite: FavoriteBarbershop;
  isMutating: boolean;
  onRemove: (favorite: FavoriteBarbershop) => void;
  onSetPrimary: (favorite: FavoriteBarbershop) => void;
  onUnsetPrimary: () => void;
};

const FavoriteCard = memo(function FavoriteCard({
  favorite,
  isMutating,
  onRemove,
  onSetPrimary,
  onUnsetPrimary,
}: FavoriteCardProps) {
  const barbershop = favorite.barbershop;
  const showLogo = barbershop?.logoUrl?.startsWith('https://');

  return (
    <SurfaceCard style={styles.card}>
      {showLogo && barbershop ? (
        <Image
          accessibilityLabel={`Logo de ${barbershop.name}`}
          contentFit="cover"
          source={{ uri: barbershop.logoUrl! }}
          style={styles.logo}
        />
      ) : null}
      <View style={styles.titleRow}>
        <ThemedText style={styles.cardTitle}>
          {barbershop?.name ?? 'Barbería no disponible'}
        </ThemedText>
        {favorite.isPrimary ? (
          <ThemedText style={styles.primaryLabel} themeColor="primary">
            Principal
          </ThemedText>
        ) : null}
      </View>
      {barbershop?.description ? (
        <ThemedText themeColor="textSecondary">{barbershop.description}</ThemedText>
      ) : null}
      {barbershop?.address ? <ThemedText>{barbershop.address}</ThemedText> : null}
      {!barbershop ? (
        <ThemedText themeColor="textSecondary">
          Ya no está publicada. Puedes conservarla en tu lista o quitarla.
        </ThemedText>
      ) : (
        <ActionButton
          disabled={isMutating}
          label="Ver barbería"
          onPress={() => router.push(`/explore/${barbershop.id}` as Href)}
          size="compact"
        />
      )}
      <View style={styles.secondaryActions}>
        <FavoriteSecondaryAction
          disabled={isMutating}
          icon={
            favorite.isPrimary
              ? { ios: 'star.slash', android: 'star_outline', web: 'star_outline' }
              : { ios: 'star', android: 'star_border', web: 'star_border' }
          }
          label={favorite.isPrimary ? 'Quitar principal' : 'Hacer principal'}
          onPress={favorite.isPrimary ? onUnsetPrimary : () => onSetPrimary(favorite)}
        />
        <FavoriteSecondaryAction
          disabled={isMutating}
          icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
          label="Quitar favorita"
          onPress={() => onRemove(favorite)}
          tone="danger"
        />
      </View>
    </SurfaceCard>
  );
});

function FavoriteSecondaryAction({
  disabled,
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  disabled: boolean;
  icon: Parameters<typeof AppIcon>[0]['name'];
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const foreground = tone === 'danger' ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryAction,
        { borderColor: theme.border },
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
        pressed && !reduceMotion ? styles.secondaryActionPressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <AppIcon color={foreground} name={icon} size={18} />
      <ThemedText numberOfLines={1} style={[styles.secondaryActionLabel, { color: foreground }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function FavoritesScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { favorites, isLoading, isRefreshing, error, reload } = useFavorites(user?.id ?? null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const run = useCallback(
    async (favoriteId: string, operation: () => Promise<void>, successMessage: string) => {
      setMutatingId(favoriteId);
      setMutationError(null);
      setFeedback(null);
      try {
        await operation();
        setFeedback(successMessage);
        await reload();
      } catch (operationError) {
        setMutationError(getFavoriteErrorMessage(operationError));
      } finally {
        setMutatingId(null);
      }
    },
    [reload],
  );

  const renderFavorite = useCallback(
    ({ item }: { item: FavoriteBarbershop }) => (
      <FavoriteCard
        favorite={item}
        isMutating={mutatingId === item.id}
        onRemove={(favorite) =>
          user &&
          void run(
            favorite.id,
            () => removeFavorite(user.id, favorite.id),
            'Barbería eliminada de favoritas.',
          )
        }
        onSetPrimary={(favorite) =>
          user &&
          void run(
            favorite.id,
            () => changePrimaryFavorite(user.id, favorite.id),
            'Barbería establecida como principal.',
          )
        }
        onUnsetPrimary={() =>
          user &&
          void run(
            item.id,
            () => changePrimaryFavorite(user.id, null),
            'Ya no tienes una barbería principal.',
          )
        }
      />
    ),
    [mutatingId, run, user],
  );

  if (isLoading) {
    return (
      <ThemedView
        accessibilityLabel="Cargando favoritas"
        accessibilityRole="progressbar"
        style={styles.centered}
      >
        <ActivityIndicator color={theme.primary} />
        <ThemedText themeColor="textSecondary">Cargando favoritas…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={favorites}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(favorite) => favorite.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.cardTitle}>Aún no tienes favoritas</ThemedText>
            <ThemedText themeColor="textSecondary">
              Explora barberías y guarda las que quieras encontrar rápidamente.
            </ThemedText>
            <ActionButton
              label="Explorar barberías"
              onPress={() => router.push('/explore' as Href)}
            />
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Guarda varias barberías y destaca una como tu opción principal."
              title="Favoritas"
            />
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void reload()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={renderFavorite}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.three, paddingBottom: Spacing.four },
  separator: { height: Spacing.three },
  card: { gap: Spacing.three, overflow: 'hidden', padding: Spacing.four },
  logo: { width: '100%', aspectRatio: 16 / 7, borderRadius: Radius.medium },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  cardTitle: { flex: 1, fontSize: TypeScale.title, fontWeight: '700' },
  primaryLabel: { fontSize: TypeScale.caption, fontWeight: '800' },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  secondaryAction: {
    minWidth: 180,
    minHeight: 48,
    flexGrow: 1,
    flexBasis: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  secondaryActionPressed: { transform: [{ scale: 0.985 }] },
  secondaryActionLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  emptyCard: { gap: Spacing.three, padding: Spacing.four },
});

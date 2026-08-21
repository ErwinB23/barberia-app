import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { addFavorite, removeFavorite } from '@/features/favorites/actions';
import { getFavoriteErrorMessage } from '@/features/favorites/errors';
import { useFavorites } from '@/features/favorites/hooks/use-favorites';
import type { FavoriteStatus } from '@/features/favorites/types';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { filterPublicBarbershops } from '../booking-domain';
import { useFocusedResource } from '../hooks/use-focused-resource';
import { getPublicBarbershops } from '../queries';
import type { PublicBarbershop } from '../types';
import { ExploreEmptyState, ExploreListSkeleton } from './explore-barbershop-states';
import { PublicBarbershopCard } from './public-barbershop-card';

export function ExploreBarbershopsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < Layout.compactBreakpoint;
  const isWide = width >= Layout.wideBreakpoint;
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutatingBarbershopId, setMutatingBarbershopId] = useState<string | null>(null);
  const [favoriteActionError, setFavoriteActionError] = useState<string | null>(null);
  const load = useCallback(() => getPublicBarbershops(), []);
  const {
    data,
    isLoading,
    error: barbershopError,
    reload: reloadBarbershops,
  } = useFocusedResource(load);
  const {
    favorites,
    isLoading: areFavoritesLoading,
    error: favoritesError,
    reload: reloadFavorites,
  } = useFavorites(user?.id ?? null);

  const visibleBarbershops = useMemo(
    () => filterPublicBarbershops(data ?? [], query),
    [data, query],
  );
  const favoritesByBarbershopId = useMemo(
    () =>
      new Map<string, FavoriteStatus>(
        favorites.map((favorite) => [
          favorite.barbershopId,
          { id: favorite.id, isPrimary: favorite.isPrimary },
        ]),
      ),
    [favorites],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([reloadBarbershops(), reloadFavorites()]);
    setIsRefreshing(false);
  }, [reloadBarbershops, reloadFavorites]);

  const toggleFavorite = useCallback(
    async (barbershopId: string) => {
      if (!user || favoritesError || mutatingBarbershopId) return;

      const favorite = favoritesByBarbershopId.get(barbershopId) ?? null;
      setMutatingBarbershopId(barbershopId);
      setFavoriteActionError(null);
      try {
        if (favorite) await removeFavorite(user.id, favorite.id);
        else await addFavorite(user.id, barbershopId);
        await reloadFavorites();
      } catch (operationError) {
        setFavoriteActionError(getFavoriteErrorMessage(operationError));
      } finally {
        setMutatingBarbershopId(null);
      }
    },
    [favoritesByBarbershopId, favoritesError, mutatingBarbershopId, reloadFavorites, user],
  );

  const openBarbershop = useCallback((barbershopId: string) => {
    router.push({
      pathname: '/explore/[barbershopId]',
      params: { barbershopId },
    });
  }, []);

  const renderBarbershop = useCallback(
    ({ item }: { item: PublicBarbershop }) => (
      <View style={isWide ? styles.gridItem : undefined}>
        <PublicBarbershopCard
          barbershop={item}
          favorite={favoritesByBarbershopId.get(item.id) ?? null}
          favoriteUnavailable={
            !user ||
            Boolean(favoritesError) ||
            (mutatingBarbershopId !== null && mutatingBarbershopId !== item.id)
          }
          isFavoriteLoading={areFavoritesLoading || mutatingBarbershopId === item.id}
          onOpen={() => openBarbershop(item.id)}
          onToggleFavorite={() => void toggleFavorite(item.id)}
          style={isWide ? styles.wideCard : undefined}
        />
      </View>
    ),
    [
      areFavoritesLoading,
      favoritesByBarbershopId,
      favoritesError,
      isWide,
      mutatingBarbershopId,
      openBarbershop,
      toggleFavorite,
      user,
    ],
  );

  const hasSearch = query.trim().length > 0;
  const showInitialSkeleton = isLoading && data === null;

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        key={isWide ? 'explore-wide' : 'explore-compact'}
        columnWrapperStyle={isWide ? styles.columns : undefined}
        contentContainerStyle={[styles.content, isCompact ? styles.compactContent : null]}
        contentInsetAdjustmentBehavior="automatic"
        data={visibleBarbershops}
        ItemSeparatorComponent={ListSeparator}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(barbershop) => barbershop.id}
        ListEmptyComponent={
          showInitialSkeleton ? (
            <ExploreListSkeleton isWide={isWide} />
          ) : barbershopError && !data ? (
            <ExploreEmptyState
              actionLabel="Reintentar"
              description={barbershopError}
              onAction={() => void reloadBarbershops()}
              title="No pudimos cargar las barberías"
            />
          ) : hasSearch ? (
            <ExploreEmptyState
              actionLabel="Limpiar búsqueda"
              description="Prueba con otro nombre, zona o palabra clave."
              onAction={() => setQuery('')}
              title="No encontramos barberías con esa búsqueda"
            />
          ) : (
            <ExploreEmptyState
              description="Cuando una barbería publique su información, aparecerá en este espacio."
              title="Aún no hay barberías para explorar"
            />
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Encuentra un lugar, conoce sus servicios y reserva cuando estés listo."
              title="Explorar barberías"
            />
            <View
              style={[
                styles.search,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: isSearchFocused ? theme.focus : theme.border,
                },
              ]}
            >
              <AppIcon
                color={theme.textSecondary}
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={21}
              />
              <TextInput
                accessibilityLabel="Buscar barberías"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => setIsSearchFocused(false)}
                onChangeText={setQuery}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Buscar barberías"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="search"
                selectionColor={theme.primary}
                style={[styles.searchInput, { color: theme.text }]}
                value={query}
              />
              {hasSearch ? (
                <Pressable
                  accessibilityLabel="Limpiar búsqueda"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setQuery('')}
                  style={({ pressed }) => [
                    styles.clearButton,
                    pressed ? { backgroundColor: theme.surfaceMuted } : null,
                  ]}
                >
                  <AppIcon
                    color={theme.textSecondary}
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={18}
                  />
                </Pressable>
              ) : null}
            </View>

            {data ? (
              <ThemedText
                accessibilityLiveRegion="polite"
                style={styles.resultCount}
                themeColor="textSecondary"
              >
                {visibleBarbershops.length === 1
                  ? '1 barbería disponible'
                  : `${visibleBarbershops.length} barberías disponibles`}
              </ThemedText>
            ) : null}

            {barbershopError && data ? <StatusMessage message={barbershopError} /> : null}
            {favoritesError || favoriteActionError ? (
              <ThemedText
                accessibilityRole="alert"
                style={styles.secondaryError}
                themeColor="textSecondary"
              >
                {favoriteActionError ?? favoritesError} Puedes seguir explorando las barberías.
              </ThemedText>
            ) : null}
          </View>
        }
        numColumns={isWide ? 2 : 1}
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={renderBarbershop}
      />
    </ThemedView>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.five,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  search: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  searchInput: {
    minHeight: 54,
    flex: 1,
    fontSize: TypeScale.body,
  },
  clearButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  resultCount: {
    fontSize: TypeScale.label,
    lineHeight: 20,
  },
  secondaryError: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  columns: {
    gap: Spacing.three,
  },
  gridItem: {
    flex: 1,
  },
  compactContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  wideCard: {
    minHeight: 390,
  },
  separator: {
    height: Spacing.three,
  },
});

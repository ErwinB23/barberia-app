import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { useBarbershops } from '../hooks/use-barbershops';
import type { UserBarbershop } from '../types';
import { BarbershopCard } from './barbershop-card';

export function BarbershopsScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { barbershops, isLoading, isRefreshing, error, reload } = useBarbershops(user!.id);

  const renderItem = useCallback(
    ({ item }: { item: UserBarbershop }) => (
      <BarbershopCard
        item={item}
        onPress={() =>
          router.push({
            pathname: '/barbershops/[barbershopId]',
            params: { barbershopId: item.barbershop.id },
          })
        }
      />
    ),
    [],
  );

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={barbershops}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.membershipId}
        ListEmptyComponent={
          isLoading ? (
            <SurfaceCard style={styles.stateCard}>
              <ActivityIndicator color={theme.primary} size="large" />
              <ThemedText themeColor="textSecondary">Cargando tus barberías…</ThemedText>
            </SurfaceCard>
          ) : error ? (
            <SurfaceCard style={styles.stateCard}>
              <StatusMessage message={error} />
              <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
            </SurfaceCard>
          ) : (
            <SurfaceCard style={styles.stateCard}>
              <ThemedText style={styles.emptyTitle}>Tu primera barbería empieza aquí</ThemedText>
              <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
                Crea el espacio de administración y luego podrás completar servicios, horarios y
                equipo.
              </ThemedText>
              <ActionButton
                label="Crear barbería"
                onPress={() => router.push('/barbershops/create')}
              />
            </SurfaceCard>
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Consulta los espacios donde participas como administrador o barbero."
              eyebrow="Gestión"
              title="Mis barberías"
            />
            {!isLoading && !error && barbershops.length > 0 ? (
              <ActionButton
                label="Crear barbería"
                onPress={() => router.push('/barbershops/create')}
              />
            ) : null}
            {error && barbershops.length > 0 ? <StatusMessage message={error} /> : null}
          </View>
        }
        onRefresh={() => void reload()}
        refreshing={isRefreshing}
        renderItem={renderItem}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    flexGrow: 1,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.four,
    paddingBottom: Spacing.five,
  },
  separator: {
    height: Spacing.three,
  },
  stateCard: {
    alignItems: 'stretch',
    gap: Spacing.three,
    padding: Spacing.five,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: TypeScale.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});

import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { setServiceActive } from '../actions';
import { getCatalogErrorMessage } from '../errors';
import { useAdminCatalogResource } from '../hooks/use-admin-catalog-resource';
import { getServices } from '../queries';
import type { CatalogService } from '../types';
import { DeactivationConfirmation } from './deactivation-confirmation';
import { ServiceCard } from './service-card';

export function ServicesScreen({ barbershopId }: { barbershopId: string | null }) {
  const theme = useTheme();
  const [pendingDeactivation, setPendingDeactivation] = useState<CatalogService | null>(null);
  const [changingServiceId, setChangingServiceId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadServices = useCallback(
    () => (barbershopId ? getServices(barbershopId) : Promise.resolve([])),
    [barbershopId],
  );
  const { data, role, isLoading, error, reload } = useAdminCatalogResource(
    barbershopId,
    loadServices,
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const changeStatus = async (service: CatalogService, isActive: boolean) => {
    if (!barbershopId || role !== 'administrator') {
      return;
    }

    setChangingServiceId(service.id);
    setMutationError(null);
    setFeedback(null);

    try {
      await setServiceActive(barbershopId, service.id, isActive);
      setFeedback(isActive ? 'El servicio quedó activo.' : 'El servicio quedó inactivo.');
      setPendingDeactivation(null);
      await reload();
    } catch (mutation) {
      setMutationError(getCatalogErrorMessage(mutation));
    } finally {
      setChangingServiceId(null);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando servicios…</ThemedText>
      </ThemedView>
    );
  }

  if (role !== 'administrator') {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={
            error ??
            'Solo un administrador activo de esta barbería puede gestionar servicios y estilos.'
          }
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  const services = data ?? [];

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={services}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(service) => service.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Tu catálogo está listo para comenzar</ThemedText>
            <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
              Crea el primer servicio con su precio y duración. Luego podrás añadir referencias de
              estilos.
            </ThemedText>
            <ActionButton
              label="Crear primer servicio"
              onPress={() => router.push(`/barbershops/${barbershopId}/services/new`)}
            />
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Administra precios, duración y referencias visuales sin eliminar el historial."
              eyebrow="Catálogo"
              title="Servicios"
            />
            <ActionButton
              label="Nuevo servicio"
              onPress={() => router.push(`/barbershops/${barbershopId}/services/new`)}
            />
            <ActionButton
              disabled={isRefreshing}
              label="Actualizar catálogo"
              onPress={() => void refresh()}
              variant="secondary"
            />
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
            {pendingDeactivation ? (
              <DeactivationConfirmation
                isSubmitting={changingServiceId === pendingDeactivation.id}
                itemName={pendingDeactivation.name}
                itemType="servicio"
                onCancel={() => setPendingDeactivation(null)}
                onConfirm={() => void changeStatus(pendingDeactivation, false)}
              />
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <ServiceCard
            isChangingStatus={changingServiceId === item.id}
            onOpen={() => router.push(`/barbershops/${barbershopId}/services/${item.id}`)}
            onToggleStatus={() =>
              item.isActive ? setPendingDeactivation(item) : void changeStatus(item, true)
            }
            service={item}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  separator: {
    height: Spacing.three,
  },
  emptyCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});

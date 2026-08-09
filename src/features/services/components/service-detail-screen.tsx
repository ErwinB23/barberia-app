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

import { setServiceActive, setStyleActive } from '../actions';
import { getCatalogErrorMessage } from '../errors';
import { formatDuration, formatPen } from '../formatters';
import { useAdminCatalogResource } from '../hooks/use-admin-catalog-resource';
import { getServiceStyles } from '../queries';
import type { CatalogStyle } from '../types';
import { CatalogStatusBadge } from './catalog-status-badge';
import { DeactivationConfirmation } from './deactivation-confirmation';
import { StyleCard } from './style-card';

type PendingDeactivation =
  { type: 'service'; id: string; name: string } | { type: 'style'; id: string; name: string };

const SAVED_MESSAGES: Record<string, string> = {
  created: 'El servicio se creó correctamente.',
  updated: 'Los cambios del servicio se guardaron correctamente.',
  'style-created': 'El estilo se creó correctamente.',
  'style-updated': 'Los cambios del estilo se guardaron correctamente.',
};

type ServiceDetailScreenProps = {
  barbershopId: string | null;
  serviceId: string | null;
  saved: string | null;
};

export function ServiceDetailScreen({ barbershopId, serviceId, saved }: ServiceDetailScreenProps) {
  const theme = useTheme();
  const [pendingDeactivation, setPendingDeactivation] = useState<PendingDeactivation | null>(null);
  const [changingKey, setChangingKey] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(SAVED_MESSAGES[saved ?? ''] ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadCatalog = useCallback(
    () =>
      barbershopId && serviceId
        ? getServiceStyles(barbershopId, serviceId)
        : Promise.resolve({ service: null, styles: [] }),
    [barbershopId, serviceId],
  );
  const { data, role, isLoading, error, reload } = useAdminCatalogResource(
    barbershopId,
    loadCatalog,
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  const changeServiceStatus = async (isActive: boolean) => {
    if (!barbershopId || !serviceId || role !== 'administrator') {
      return;
    }

    setChangingKey(`service:${serviceId}`);
    setMutationError(null);
    setFeedback(null);

    try {
      await setServiceActive(barbershopId, serviceId, isActive);
      setFeedback(isActive ? 'El servicio quedó activo.' : 'El servicio quedó inactivo.');
      setPendingDeactivation(null);
      await reload();
    } catch (mutation) {
      setMutationError(getCatalogErrorMessage(mutation));
    } finally {
      setChangingKey(null);
    }
  };

  const changeStyleStatus = async (style: CatalogStyle, isActive: boolean) => {
    if (!barbershopId || !serviceId || role !== 'administrator') {
      return;
    }

    setChangingKey(`style:${style.id}`);
    setMutationError(null);
    setFeedback(null);

    try {
      await setStyleActive(barbershopId, serviceId, style.id, isActive);
      setFeedback(isActive ? 'El estilo quedó activo.' : 'El estilo quedó inactivo.');
      setPendingDeactivation(null);
      await reload();
    } catch (mutation) {
      setMutationError(getCatalogErrorMessage(mutation));
    } finally {
      setChangingKey(null);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando servicio y estilos…</ThemedText>
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

  if (!data?.service || !barbershopId || !serviceId) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'El servicio solicitado no está disponible.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  const { service, styles: catalogStyles } = data;
  const pendingStyle =
    pendingDeactivation?.type === 'style'
      ? catalogStyles.find((style) => style.id === pendingDeactivation.id)
      : null;

  const confirmPendingDeactivation = () => {
    if (pendingDeactivation?.type === 'service') {
      void changeServiceStatus(false);
    } else if (pendingStyle) {
      void changeStyleStatus(pendingStyle, false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={catalogStyles}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(style) => style.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Sin estilos asociados</ThemedText>
            <ThemedText style={styles.description} themeColor="textSecondary">
              Los estilos son referencias visuales y no modifican el precio ni la duración del
              servicio.
            </ThemedText>
            <ActionButton
              label="Crear primer estilo"
              onPress={() =>
                router.push(`/barbershops/${barbershopId}/services/${serviceId}/styles/new`)
              }
            />
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description={
                service.description ?? 'Configura este servicio y sus referencias visuales.'
              }
              eyebrow="Servicio"
              title={service.name}
            />

            <ActionButton
              disabled={isRefreshing}
              label="Actualizar servicio"
              onPress={() => void refresh()}
              variant="secondary"
            />

            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}

            {pendingDeactivation ? (
              <DeactivationConfirmation
                isSubmitting={
                  changingKey === `${pendingDeactivation.type}:${pendingDeactivation.id}`
                }
                itemName={pendingDeactivation.name}
                itemType={pendingDeactivation.type === 'service' ? 'servicio' : 'estilo'}
                onCancel={() => setPendingDeactivation(null)}
                onConfirm={confirmPendingDeactivation}
              />
            ) : null}

            <SurfaceCard style={styles.summaryCard}>
              <View style={styles.summaryHeading}>
                <ThemedText style={styles.sectionTitle}>Configuración</ThemedText>
                <CatalogStatusBadge isActive={service.isActive} />
              </View>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <ThemedText style={styles.metricLabel} themeColor="textSecondary">
                    Precio
                  </ThemedText>
                  <ThemedText style={styles.metricValue}>{formatPen(service.price)}</ThemedText>
                </View>
                <View style={styles.metric}>
                  <ThemedText style={styles.metricLabel} themeColor="textSecondary">
                    Duración
                  </ThemedText>
                  <ThemedText style={styles.metricValue}>
                    {formatDuration(service.durationMinutes)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.actions}>
                <ActionButton
                  label="Editar servicio"
                  onPress={() =>
                    router.push(`/barbershops/${barbershopId}/services/${serviceId}/edit`)
                  }
                  variant="secondary"
                />
                <ActionButton
                  isLoading={changingKey === `service:${service.id}`}
                  label={service.isActive ? 'Desactivar servicio' : 'Activar servicio'}
                  onPress={() =>
                    service.isActive
                      ? setPendingDeactivation({
                          type: 'service',
                          id: service.id,
                          name: service.name,
                        })
                      : void changeServiceStatus(true)
                  }
                  variant={service.isActive ? 'danger' : 'secondary'}
                />
              </View>
            </SurfaceCard>

            <View style={styles.stylesHeading}>
              <View style={styles.stylesCopy}>
                <ThemedText style={styles.sectionTitle}>Estilos</ThemedText>
                <ThemedText style={styles.description} themeColor="textSecondary">
                  Referencias visuales disponibles para este servicio.
                </ThemedText>
              </View>
              <ActionButton
                label="Nuevo estilo"
                onPress={() =>
                  router.push(`/barbershops/${barbershopId}/services/${serviceId}/styles/new`)
                }
              />
            </View>
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
          <StyleCard
            isChangingStatus={changingKey === `style:${item.id}`}
            onEdit={() =>
              router.push(
                `/barbershops/${barbershopId}/services/${serviceId}/styles/${item.id}/edit`,
              )
            }
            onToggleStatus={() =>
              item.isActive
                ? setPendingDeactivation({ type: 'style', id: item.id, name: item.name })
                : void changeStyleStatus(item, true)
            }
            style={item}
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
  summaryCard: {
    gap: Spacing.four,
    padding: Spacing.four,
  },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metric: {
    flex: 1,
    gap: Spacing.one,
  },
  metricLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  actions: {
    gap: Spacing.two,
  },
  stylesHeading: {
    gap: Spacing.three,
  },
  stylesCopy: {
    gap: Spacing.one,
  },
  description: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  emptyCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  emptyTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
});

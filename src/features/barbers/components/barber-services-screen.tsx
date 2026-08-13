import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { assignBarberService, unassignBarberService } from '../actions';
import type { BarberOperationalAccess } from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getAssignedBarberServices, getBarberServiceOptions } from '../queries';
import type { BarberServiceOption } from '../types';

export function BarberServicesScreen({
  barbershopId,
  barberId,
}: {
  barbershopId: string | null;
  barberId: string | null;
}) {
  const theme = useTheme();
  const [pendingRemoval, setPendingRemoval] = useState<BarberServiceOption | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const load = useCallback(
    (access: BarberOperationalAccess) => {
      if (!barbershopId || !barberId) return Promise.resolve([]);
      return access.canManageServices
        ? getBarberServiceOptions(barbershopId, barberId)
        : getAssignedBarberServices(barbershopId, barberId);
    },
    [barberId, barbershopId],
  );
  const resource = useBarberProfileResource(barbershopId, barberId, load, 'services');
  const refresh = async () => {
    setIsRefreshing(true);
    await resource.reload();
    setIsRefreshing(false);
  };
  const change = async (service: BarberServiceOption, assign: boolean) => {
    if (!barbershopId || !barberId || !resource.access.canManageServices) return;
    setChangingId(service.id);
    setMutationError(null);
    setFeedback(null);
    try {
      if (assign) await assignBarberService(barbershopId, barberId, service.id);
      else await unassignBarberService(barbershopId, barberId, service.id);
      setFeedback(
        assign ? 'Servicio asignado correctamente.' : 'Asignación eliminada correctamente.',
      );
      setPendingRemoval(null);
      await resource.reload();
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'services'));
    } finally {
      setChangingId(null);
    }
  };
  if (resource.isLoading)
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando servicios…</ThemedText>
      </ThemedView>
    );
  if (!resource.access.canViewServices)
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={resource.error ?? 'No tienes acceso a estos servicios.'} />
        <ActionButton
          label="Reintentar"
          onPress={() => void resource.reload()}
          variant="secondary"
        />
      </ThemedView>
    );
  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={resource.data ?? []}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description={
                resource.access.canManageServices
                  ? 'Asigna únicamente servicios del catálogo de esta barbería.'
                  : 'Consulta los servicios que la administración asignó a tu perfil.'
              }
              eyebrow="Capacidades"
              title={resource.isOwnProfile ? 'Mis servicios' : 'Servicios del barbero'}
            />
            <ActionButton
              disabled={isRefreshing}
              label="Actualizar servicios"
              onPress={() => void refresh()}
              variant="secondary"
            />
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {resource.error || mutationError ? (
              <StatusMessage message={mutationError ?? resource.error!} />
            ) : null}
            {resource.access.canManageServices && pendingRemoval ? (
              <SurfaceCard style={styles.confirm}>
                <ThemedText style={styles.title}>¿Quitar {pendingRemoval.name}?</ThemedText>
                <ThemedText themeColor="textSecondary">
                  La base rechazará el cambio si una reserva futura activa necesita esta asignación.
                </ThemedText>
                <View style={styles.actions}>
                  <ActionButton
                    disabled={changingId === pendingRemoval.id}
                    label="Cancelar"
                    onPress={() => setPendingRemoval(null)}
                    variant="secondary"
                  />
                  <ActionButton
                    isLoading={changingId === pendingRemoval.id}
                    label="Quitar servicio"
                    onPress={() => void change(pendingRemoval, false)}
                    variant="danger"
                  />
                </View>
              </SurfaceCard>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <SurfaceCard style={styles.empty}>
            <ThemedText style={styles.title}>
              {resource.access.canManageServices
                ? 'No hay servicios en el catálogo'
                : 'No tienes servicios asignados'}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {resource.access.canManageServices
                ? 'Crea servicios antes de configurar las capacidades del barbero.'
                : 'La administración de la barbería debe asignarlos a tu perfil.'}
            </ThemedText>
          </SurfaceCard>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => {
          const content = (
            <>
              <View style={styles.optionCopy}>
                <ThemedText style={styles.optionName}>{item.name}</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {item.isActive ? 'Servicio activo' : 'Servicio inactivo'}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: item.isAssigned ? theme.successSurface : theme.surfaceMuted },
                ]}
              >
                <ThemedText
                  style={{
                    color: item.isAssigned ? theme.success : theme.textSecondary,
                    fontWeight: '700',
                  }}
                >
                  {item.isAssigned ? 'Asignado' : 'Asignar'}
                </ThemedText>
              </View>
            </>
          );
          const optionStyle = [
            styles.option,
            {
              backgroundColor: theme.surface,
              borderColor: item.isAssigned ? theme.primary : theme.border,
            },
          ];

          return resource.access.canManageServices ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ checked: item.isAssigned, disabled: changingId === item.id }}
              disabled={changingId === item.id}
              onPress={() => (item.isAssigned ? setPendingRemoval(item) : void change(item, true))}
              style={({ pressed }) => [
                ...optionStyle,
                pressed ? { backgroundColor: theme.surfaceMuted } : null,
              ]}
            >
              {content}
            </Pressable>
          ) : (
            <View style={optionStyle}>{content}</View>
          );
        }}
      />
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.four, paddingBottom: Spacing.four },
  separator: { height: Spacing.three },
  option: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  optionCopy: { flex: 1, gap: Spacing.one },
  optionName: { fontSize: TypeScale.body, fontWeight: '700' },
  badge: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  confirm: { gap: Spacing.three, padding: Spacing.four },
  actions: { gap: Spacing.two },
  empty: { gap: Spacing.three, padding: Spacing.four },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
});

import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { formatPen } from '@/features/booking';
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

import { assignBarberService, unassignBarberService } from '../actions';
import { getBarberWorkspaceRoutes, type BarberOperationalAccess } from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import {
  getAssignedBarberServices,
  getBarberServiceOptions,
  getBarbershopContextName,
} from '../queries';
import type { BarberServiceOption } from '../types';
import { BarberContextBanner } from './barber-context-banner';
import { BarberScreenSkeleton } from './barber-screen-skeleton';

function AssignedServiceCard({ service }: { service: BarberServiceOption }) {
  const theme = useTheme();

  return (
    <SurfaceCard style={styles.assignedCard}>
      <View style={styles.assignedHeader}>
        <View style={[styles.assignedIcon, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
            size={20}
          />
        </View>
        <View style={styles.optionCopy}>
          <View style={styles.assignedNameRow}>
            <ThemedText selectable style={styles.optionName}>
              {service.name}
            </ThemedText>
            <View
              style={[
                styles.serviceStatus,
                { backgroundColor: service.isActive ? theme.successSurface : theme.surfaceMuted },
              ]}
            >
              <ThemedText
                style={[
                  styles.serviceStatusLabel,
                  { color: service.isActive ? theme.success : theme.textSecondary },
                ]}
              >
                {service.isActive ? 'Activo' : 'Inactivo'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.assignedMetaRow}>
            <ThemedText style={styles.assignedMeta} themeColor="textSecondary">
              {service.durationMinutes} min
            </ThemedText>
            <ThemedText
              selectable
              style={[styles.assignedMeta, styles.assignedPrice]}
              themeColor="textSecondary"
            >
              {formatPen(service.price)}
            </ThemedText>
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}

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
    async (access: BarberOperationalAccess) => {
      if (!barbershopId || !barberId) return { services: [], barbershopName: null };
      const [services, barbershopName] = await Promise.all([
        access.canManageServices
          ? getBarberServiceOptions(barbershopId, barberId)
          : getAssignedBarberServices(barbershopId, barberId),
        getBarbershopContextName(barbershopId),
      ]);
      return { services, barbershopName };
    },
    [barberId, barbershopId],
  );
  const resource = useBarberProfileResource(barbershopId, barberId, load, 'services');
  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await resource.reload();
    } finally {
      setIsRefreshing(false);
    }
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
  if (resource.isLoading) return <BarberScreenSkeleton />;
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
  const services = resource.data?.services ?? [];
  const routes = barbershopId && barberId ? getBarberWorkspaceRoutes(barbershopId, barberId) : null;

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={services}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {resource.isOwnProfile ? (
              <>
                <BarberContextBanner
                  barbershopName={resource.data?.barbershopName ?? null}
                  onOpenWorkspace={
                    routes ? () => router.replace(routes.workspace as Href) : undefined
                  }
                />
                <ThemedText style={styles.intro} themeColor="textSecondary">
                  Estos son los servicios que un administrador asignó a tu perfil profesional.
                </ThemedText>
              </>
            ) : (
              <ScreenHeading
                description="Asigna únicamente servicios del catálogo de esta barbería."
                eyebrow="Capacidades"
                title="Servicios del barbero"
              />
            )}
            <View style={resource.isOwnProfile ? styles.refreshAction : null}>
              <ActionButton
                disabled={isRefreshing}
                label="Actualizar servicios"
                onPress={() => void refresh()}
                size={resource.isOwnProfile ? 'compact' : 'default'}
                variant="secondary"
              />
            </View>
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
                : 'No tienes servicios asignados todavía.'}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {resource.access.canManageServices
                ? 'Crea servicios antes de configurar las capacidades del barbero.'
                : 'Un administrador de la barbería debe asignarlos.'}
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
          if (!resource.access.canManageServices) {
            return <AssignedServiceCard service={item} />;
          }

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
  intro: { maxWidth: 620, fontSize: TypeScale.label, lineHeight: 21 },
  refreshAction: { alignItems: 'flex-start' },
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
  optionCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  optionName: { minWidth: 0, flex: 1, fontSize: TypeScale.body, fontWeight: '700' },
  assignedCard: { padding: Spacing.three },
  assignedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  assignedIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  assignedNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  assignedMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  assignedMeta: { fontSize: TypeScale.label, lineHeight: 21, fontVariant: ['tabular-nums'] },
  assignedPrice: { fontWeight: '700' },
  serviceStatus: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  serviceStatusLabel: { fontSize: TypeScale.caption, fontWeight: '800' },
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

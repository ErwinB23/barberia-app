import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { deactivateBarber } from '../actions';
import { isSafeRemoteImageUrl } from '../barber-domain';
import { getBarberErrorMessage } from '../errors';
import { useBarberProfileResource } from '../hooks/use-barber-profile-resource';
import { getBarber } from '../queries';

export function BarberDetailScreen({
  barbershopId,
  barberId,
}: {
  barbershopId: string | null;
  barberId: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const loadBarber = useCallback(
    () => (barbershopId && barberId ? getBarber(barbershopId, barberId) : Promise.resolve(null)),
    [barberId, barbershopId],
  );
  const {
    data: barber,
    role,
    isOwnProfile,
    access,
    isLoading,
    error,
    reload,
  } = useBarberProfileResource(barbershopId, barberId, loadBarber);
  const deactivate = async () => {
    if (!barber || !access.canDeactivate) return;
    setIsDeactivating(true);
    setMutationError(null);
    try {
      await deactivateBarber(barber.id);
      setConfirming(false);
      if (isOwnProfile && role !== 'administrator') {
        router.replace('/barbershops');
      } else {
        await reload();
      }
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'barbers'));
    } finally {
      setIsDeactivating(false);
    }
  };
  if (isLoading)
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando perfil…</ThemedText>
      </ThemedView>
    );
  if (!barber || !barbershopId)
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={error ?? 'El perfil solicitado no está disponible para administrar.'}
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeading
          description={barber.isActive ? 'Perfil operativo activo' : 'Perfil operativo inactivo'}
          eyebrow="Barbero"
          title={barber.displayName}
        />
        <SurfaceCard style={styles.card}>
          {isSafeRemoteImageUrl(barber.photoUrl) ? (
            <Image
              accessibilityLabel={`Foto de ${barber.displayName}`}
              source={{ uri: barber.photoUrl! }}
              style={styles.photo}
            />
          ) : null}
          <ThemedText style={styles.sectionTitle}>Perfil público</ThemedText>
          <ThemedText selectable themeColor="textSecondary">
            {barber.bio ?? 'Sin descripción pública.'}
          </ThemedText>
          <ThemedText selectable themeColor="textSecondary">
            {barber.services.length
              ? barber.services.map((service) => service.name).join(' · ')
              : 'Sin servicios asignados'}
          </ThemedText>
          {access.canEditProfile ? (
            <ActionButton
              label="Editar perfil público"
              onPress={() => router.push(`/barbershops/${barbershopId}/barbers/${barber.id}/edit`)}
              variant="secondary"
            />
          ) : null}
        </SurfaceCard>
        {access.canAccess ? (
          <>
            <SurfaceCard style={styles.card}>
              <ThemedText style={styles.sectionTitle}>
                {isOwnProfile ? 'Mi espacio operativo' : 'Operación'}
              </ThemedText>
              <ActionButton
                label={isOwnProfile ? 'Mis servicios' : 'Servicios asignados'}
                onPress={() =>
                  router.push(`/barbershops/${barbershopId}/barbers/${barber.id}/services`)
                }
                variant="secondary"
              />
              <ActionButton
                label={isOwnProfile ? 'Mi horario' : 'Horario individual'}
                onPress={() =>
                  router.push(`/barbershops/${barbershopId}/barbers/${barber.id}/schedule`)
                }
                variant="secondary"
              />
              <ActionButton
                label={isOwnProfile ? 'Mis bloqueos' : 'Bloqueos excepcionales'}
                onPress={() =>
                  router.push(`/barbershops/${barbershopId}/barbers/${barber.id}/blocks`)
                }
                variant="secondary"
              />
            </SurfaceCard>
            <SurfaceCard style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Estado</ThemedText>
              {!barber.isActive ? (
                <StatusMessage message="La V1 no expone una operación para reactivar a otro barbero. La reactivación propia solo está disponible para un administrador mediante la RPC correspondiente." />
              ) : confirming ? (
                <>
                  <StatusMessage message="La desactivación será rechazada si existen reservas activas futuras." />
                  <View style={styles.actions}>
                    <ActionButton
                      disabled={isDeactivating}
                      label="Cancelar"
                      onPress={() => setConfirming(false)}
                      variant="secondary"
                    />
                    <ActionButton
                      isLoading={isDeactivating}
                      label="Desactivar"
                      onPress={() => void deactivate()}
                      variant="danger"
                    />
                  </View>
                </>
              ) : (
                <ActionButton
                  label={isOwnProfile ? 'Desactivar mi perfil de barbero' : 'Desactivar barbero'}
                  onPress={() => setConfirming(true)}
                  variant="danger"
                />
              )}
              {mutationError ? <StatusMessage message={mutationError} /> : null}
            </SurfaceCard>
          </>
        ) : null}
      </ScrollView>
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
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  card: { gap: Spacing.three, padding: Spacing.four },
  photo: { width: 96, height: 96, borderRadius: Radius.pill, alignSelf: 'center' },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  actions: { gap: Spacing.two },
});

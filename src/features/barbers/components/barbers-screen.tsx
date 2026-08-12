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

import { enableOwnBarberProfile } from '../actions';
import { getBarberErrorMessage } from '../errors';
import { useAdminBarberResource } from '../hooks/use-admin-barber-resource';
import { getBarbers, getOwnBarberProfile } from '../queries';
import { BarberCard } from './barber-card';

export function BarbersScreen({ barbershopId }: { barbershopId: string | null }) {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEnablingOwnProfile, setIsEnablingOwnProfile] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const loadBarbers = useCallback(
    () =>
      barbershopId
        ? Promise.all([getBarbers(barbershopId), getOwnBarberProfile(barbershopId)]).then(
            ([barbers, ownProfile]) => ({ barbers, ownProfile }),
          )
        : Promise.resolve({ barbers: [], ownProfile: null }),
    [barbershopId],
  );
  const { data, role, isLoading, error, reload } = useAdminBarberResource(
    barbershopId,
    loadBarbers,
    'barbers',
  );

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };
  const enableOwn = async () => {
    if (!barbershopId || role !== 'administrator') return;
    setIsEnablingOwnProfile(true);
    setMutationError(null);
    setFeedback(null);
    try {
      const barberId = await enableOwnBarberProfile(barbershopId);
      setFeedback('Tu perfil operativo quedó activo sin cambiar tu rol de administrador.');
      await reload();
      router.push(`/barbershops/${barbershopId}/barbers/${barberId}`);
    } catch (mutation) {
      setMutationError(getBarberErrorMessage(mutation, 'barbers'));
    } finally {
      setIsEnablingOwnProfile(false);
    }
  };

  if (isLoading)
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando barberos…</ThemedText>
      </ThemedView>
    );
  if (role !== 'administrator')
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={error ?? 'Solo un administrador activo puede gestionar barberos.'}
        />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );

  const ownProfile = data?.ownProfile ?? null;

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={data?.barbers ?? []}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(barber) => barber.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.empty}>
            <ThemedText style={styles.title}>Aún no hay barberos</ThemedText>
            <ThemedText themeColor="textSecondary">
              Las altas de otros usuarios llegarán mediante invitaciones. Si atiendes personalmente,
              activa tu propio perfil.
            </ThemedText>
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Gestiona el equipo operativo, sus servicios, horarios y bloqueos."
              eyebrow="Equipo"
              title="Barberos"
            />
            <SurfaceCard style={[styles.info, { backgroundColor: theme.surfaceMuted }]}>
              <ThemedText style={styles.title}>Perfil operativo propio</ThemedText>
              {ownProfile?.isActive ? (
                <>
                  <StatusMessage
                    message="Tu perfil operativo ya está activo y conserva tu rol de administrador."
                    tone="success"
                  />
                  <ActionButton
                    label="Ver mi perfil de barbero"
                    onPress={() =>
                      router.push(`/barbershops/${barbershopId}/barbers/${ownProfile.barberId}`)
                    }
                    variant="secondary"
                  />
                </>
              ) : (
                <>
                  <ThemedText style={styles.body} themeColor="textSecondary">
                    {ownProfile
                      ? 'Tu perfil ya existe, pero está inactivo. Puedes reactivar exclusivamente tu propio perfil.'
                      : 'Esta acción crea exclusivamente tu propio perfil operativo. Tu rol de administrador se conserva.'}
                  </ThemedText>
                  <ActionButton
                    isLoading={isEnablingOwnProfile}
                    label={
                      ownProfile ? 'Reactivar mi perfil de barbero' : 'También trabajo como barbero'
                    }
                    onPress={() => void enableOwn()}
                  />
                </>
              )}
            </SurfaceCard>
            <ActionButton
              disabled={isRefreshing}
              label="Actualizar equipo"
              onPress={() => void refresh()}
              variant="secondary"
            />
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error || mutationError ? <StatusMessage message={mutationError ?? error!} /> : null}
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
          <BarberCard
            barber={item}
            onOpen={() => router.push(`/barbershops/${barbershopId}/barbers/${item.id}`)}
          />
        )}
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
  info: { gap: Spacing.three, padding: Spacing.four },
  empty: { gap: Spacing.three, padding: Spacing.four },
  title: { fontSize: TypeScale.title, fontWeight: '700' },
  body: { fontSize: TypeScale.label, lineHeight: 21 },
});

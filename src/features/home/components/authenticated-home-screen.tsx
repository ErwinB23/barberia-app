import { ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { usePendingInvitationCount } from '@/features/invitations/hooks/use-pending-invitation-count';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-unread-notification-count';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

export function AuthenticatedHomeScreen() {
  const { user } = useAuth();
  const { profile, error } = useProfile(user!);
  const { count: pendingInvitationCount, error: invitationCountError } = usePendingInvitationCount(
    user?.id ?? null,
  );
  const { count: unreadNotificationCount, error: notificationCountError } =
    useUnreadNotificationCount(user?.id ?? null);
  const firstName = profile?.fullName?.trim().split(/\s+/)[0];

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeading
          description="Reserva como cliente o entra a los espacios de trabajo asociados a tu cuenta."
          eyebrow="Inicio"
          title={firstName ? `Hola, ${firstName}` : 'Bienvenido'}
        />
        {error ? <StatusMessage message={error} /> : null}
        <SurfaceCard style={styles.primaryCard}>
          <View style={styles.cardCopy}>
            <ThemedText style={styles.cardTitle}>Reservar una cita</ThemedText>
            <ThemedText style={styles.cardDescription} themeColor="textSecondary">
              Explora barberías publicadas, combina servicios y elige un turno real.
            </ThemedText>
          </View>
          <ActionButton
            label="Explorar barberías"
            onPress={() => router.push('/explore' as Href)}
          />
          <ActionButton
            label="Mis reservas"
            onPress={() => router.push('/reservations' as Href)}
            variant="secondary"
          />
          <ActionButton
            label="Favoritas"
            onPress={() => router.push('/favorites' as Href)}
            variant="secondary"
          />
        </SurfaceCard>
        <SurfaceCard style={styles.secondaryCard}>
          <View style={styles.cardCopy}>
            <ThemedText style={styles.cardTitle}>Espacios de trabajo</ThemedText>
            <ThemedText style={styles.cardDescription} themeColor="textSecondary">
              Entra a tu espacio operativo como barbero o a la administración cuando corresponda.
            </ThemedText>
          </View>
          <ActionButton label="Ver mis barberías" onPress={() => router.push('/barbershops')} />
          <ActionButton
            label="Crear barbería"
            onPress={() => router.push('/barbershops/create')}
            variant="secondary"
          />
        </SurfaceCard>
        <SurfaceCard style={styles.secondaryCard}>
          <View style={styles.cardCopy}>
            <ThemedText style={styles.cardTitle}>Cuenta personal</ThemedText>
            <ThemedText style={styles.cardDescription} themeColor="textSecondary">
              Revisa los datos de tu perfil o cierra la sesión de este dispositivo.
            </ThemedText>
          </View>
          <ActionButton
            label={
              unreadNotificationCount > 0
                ? `Notificaciones (${unreadNotificationCount})`
                : 'Notificaciones'
            }
            onPress={() => router.push('/notifications' as Href)}
            variant="secondary"
          />
          <ActionButton
            label={
              pendingInvitationCount > 0
                ? `Invitaciones (${pendingInvitationCount})`
                : 'Invitaciones'
            }
            onPress={() => router.push('/invitations' as Href)}
            variant="secondary"
          />
          <ActionButton
            label="Ir a mi perfil"
            onPress={() => router.push('/profile')}
            variant="secondary"
          />
          {invitationCountError ? (
            <StatusMessage message="No pudimos consultar el contador de invitaciones." />
          ) : null}
          {notificationCountError ? (
            <StatusMessage message="No pudimos consultar el contador de notificaciones." />
          ) : null}
        </SurfaceCard>
      </ScrollView>
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
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  primaryCard: {
    gap: Spacing.three,
    padding: Spacing.five,
  },
  secondaryCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  cardCopy: {
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
});

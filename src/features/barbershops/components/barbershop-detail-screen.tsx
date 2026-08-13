import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { OwnBarberProfileCard } from '@/features/barbers/components/own-barber-profile-card';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { useBarbershopDetail } from '../hooks/use-barbershop-detail';
import { getMembershipRoleLabel } from '../mappers';
import { BarbershopPublicationCard } from './barbershop-publication-card';
import { BarbershopStatusBadge } from './barbershop-status-badge';

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.detailRow,
        !isLast ? { borderBottomColor: theme.border, borderBottomWidth: 1 } : null,
      ]}
    >
      <ThemedText style={styles.detailLabel} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export function BarbershopDetailScreen({ barbershopId }: { barbershopId: string | null }) {
  const { user } = useAuth();
  const { detail, isLoading, error, reload } = useBarbershopDetail(user!.id, barbershopId);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando barbería…</ThemedText>
      </ThemedView>
    );
  }

  if (!detail || !barbershopId) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'La barbería solicitada no está disponible.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  const isAdmin = detail.role === 'administrator';

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.heading}>
          <ScreenHeading
            description={`Acceso como ${getMembershipRoleLabel(detail.role).toLowerCase()}.`}
            eyebrow="Administración"
            title={detail.barbershop.name}
          />
          <BarbershopStatusBadge status={detail.barbershop.status} />
        </View>

        <SurfaceCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Datos generales</ThemedText>
          <DetailRow label="Rol" value={getMembershipRoleLabel(detail.role)} />
          <DetailRow label="Teléfono" value={detail.barbershop.phone ?? 'No registrado'} />
          <DetailRow label="Dirección" value={detail.barbershop.address ?? 'No registrada'} />
          <DetailRow
            label="Referencia"
            value={detail.barbershop.locationReference ?? 'No registrada'}
          />
          <DetailRow
            isLast
            label="Descripción"
            value={detail.barbershop.description ?? 'No registrada'}
          />
        </SurfaceCard>

        {isAdmin ? (
          <>
            <SurfaceCard style={styles.card}>
              <View style={styles.sectionCopy}>
                <ThemedText style={styles.sectionTitle}>Configuración</ThemedText>
                <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
                  Administra la identidad, las reglas operativas y los datos de pago.
                </ThemedText>
              </View>
              <ActionButton
                label="Editar datos generales"
                onPress={() => router.push(`/barbershops/${barbershopId}/edit`)}
                variant="secondary"
              />
              <ActionButton
                label="Ajustes generales"
                onPress={() => router.push(`/barbershops/${barbershopId}/settings`)}
                variant="secondary"
              />
              <ActionButton
                label="Configuración Yape"
                onPress={() => router.push(`/barbershops/${barbershopId}/payment-settings`)}
                variant="secondary"
              />
              <ActionButton
                label="Servicios y estilos"
                onPress={() => router.push(`/barbershops/${barbershopId}/services`)}
                variant="secondary"
              />
              <ActionButton
                label="Agenda y pagos"
                onPress={() => router.push(`/barbershops/${barbershopId}/appointments`)}
                variant="secondary"
              />
              <ActionButton
                label="Horarios y cierres"
                onPress={() => router.push(`/barbershops/${barbershopId}/schedules`)}
                variant="secondary"
              />
              <ActionButton
                label="Barberos"
                onPress={() => router.push(`/barbershops/${barbershopId}/barbers`)}
                variant="secondary"
              />
              <ActionButton
                label="Invitaciones de personal"
                onPress={() => router.push(`/barbershops/${barbershopId}/invitations`)}
                variant="secondary"
              />
            </SurfaceCard>
            <OwnBarberProfileCard barbershopId={barbershopId} />
            {detail.publicationReadiness ? (
              <BarbershopPublicationCard
                barbershopId={barbershopId}
                onRefresh={reload}
                readiness={detail.publicationReadiness}
                status={detail.barbershop.status}
              />
            ) : null}
          </>
        ) : (
          <OwnBarberProfileCard barbershopId={barbershopId} />
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  heading: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  sectionCopy: {
    gap: Spacing.one,
  },
  sectionTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  detailRow: {
    gap: Spacing.one,
    paddingVertical: Spacing.three,
  },
  detailLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
});

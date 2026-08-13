import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatLimaDate, formatLimaTime, formatPen, useFocusedResource } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { getReservationStatusLabel, groupClientReservations } from '../reservation-domain';
import { getClientReservations } from '../queries';
import type { ClientReservation } from '../types';

function ReservationCard({ reservation }: { reservation: ClientReservation }) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <ThemedText style={styles.cardTitle}>{reservation.barbershopName}</ThemedText>
        <ThemedText style={styles.status} themeColor="textSecondary">
          {getReservationStatusLabel(reservation.status)}
        </ThemedText>
      </View>
      <ThemedText style={styles.date}>
        {formatLimaDate(reservation.startsAt)} · {formatLimaTime(reservation.startsAt)}
      </ThemedText>
      <ThemedText themeColor="textSecondary">Con {reservation.barberName}</ThemedText>
      <View style={styles.metaRow}>
        <ThemedText>{formatPen(reservation.totalPrice)}</ThemedText>
        <ThemedText themeColor="textSecondary">{reservation.totalDurationMinutes} min</ThemedText>
      </View>
      <ActionButton
        label="Ver detalle"
        onPress={() => router.push(`/reservations/${reservation.id}` as Href)}
        variant="secondary"
      />
    </SurfaceCard>
  );
}

export function ReservationsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const load = useCallback(
    () => (user ? getClientReservations(user.id) : Promise.resolve([])),
    [user],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);
  const grouped = useMemo(() => groupClientReservations(data ?? []), [data]);
  const sections = [
    { title: 'Próximas', data: grouped.upcoming },
    { title: 'Historial', data: grouped.history },
  ];

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando tus reservas…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SectionList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={(reservation) => reservation.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.cardTitle}>Aún no tienes reservas</ThemedText>
            <ThemedText themeColor="textSecondary">
              Explora las barberías publicadas y elige un horario disponible.
            </ThemedText>
            <ActionButton
              label="Explorar barberías"
              onPress={() => router.push('/explore' as Href)}
            />
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description="Consulta tus próximas citas y el historial de atención."
              eyebrow="Cliente"
              title="Mis reservas"
            />
            {error ? <StatusMessage message={error} /> : null}
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
        renderItem={({ item }) => <ReservationCard reservation={item} />}
        renderSectionHeader={({ section }) =>
          section.data.length > 0 ? (
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            </ThemedView>
          ) : null
        }
        sections={sections}
        SectionSeparatorComponent={() => <View style={styles.separator} />}
        stickySectionHeadersEnabled={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.three, paddingBottom: Spacing.four },
  sectionHeader: { paddingTop: Spacing.four, paddingBottom: Spacing.two },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  separator: { height: Spacing.three },
  card: { gap: Spacing.two, marginBottom: Spacing.three, padding: Spacing.four },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  cardTitle: { flex: 1, fontSize: TypeScale.title, fontWeight: '700' },
  status: { fontSize: TypeScale.label, fontWeight: '700' },
  date: { fontSize: TypeScale.body, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  emptyCard: { gap: Spacing.three, padding: Spacing.four },
});

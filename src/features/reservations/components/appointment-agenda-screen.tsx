import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
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
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import {
  filterAgendaAppointments,
  type AgendaFilters,
  type AgendaPeriod,
} from '../appointment-domain';
import { getOperationalAgenda } from '../queries';
import { getPaymentMethodLabel } from '../reservation-domain';
import type { OperationalAppointment, ReservationStatus } from '../types';
import { PaymentStatusBadge, ReservationStatusBadge } from './appointment-status-badge';

const PERIODS: readonly { value: AgendaPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'upcoming', label: 'Próximas' },
  { value: 'history', label: 'Historial' },
];

const STATUSES: readonly { value: ReservationStatus | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'in_progress', label: 'En atención' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'no_show', label: 'No asistieron' },
];

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <ThemedText style={[styles.chipLabel, selected ? { color: theme.onPrimary } : null]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function AppointmentCard({
  appointment,
  onOpen,
  showBarber,
}: {
  appointment: OperationalAppointment;
  onOpen: () => void;
  showBarber: boolean;
}) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.cardHeading}>
        <View style={styles.cardCopy}>
          <ThemedText style={styles.cardTitle}>{formatLimaTime(appointment.startsAt)}</ThemedText>
          <ThemedText themeColor="textSecondary">{formatLimaDate(appointment.startsAt)}</ThemedText>
        </View>
        <ReservationStatusBadge status={appointment.status} />
      </View>

      {showBarber ? <ThemedText>Barbero: {appointment.barberName}</ThemedText> : null}
      <ThemedText themeColor="textSecondary">
        Cliente: {appointment.clientContact.fullName ?? 'Sin nombre registrado'}
      </ThemedText>
      {appointment.clientContact.phone ? (
        <ThemedText selectable themeColor="textSecondary">
          Teléfono: {appointment.clientContact.phone}
        </ThemedText>
      ) : null}
      <ThemedText themeColor="textSecondary">
        {appointment.items.length > 0
          ? appointment.items.map((item) => item.serviceName).join(' · ')
          : 'Servicios reservados'}
      </ThemedText>

      <View style={styles.metaRow}>
        <ThemedText>{appointment.totalDurationMinutes} min</ThemedText>
        <ThemedText>{formatPen(appointment.totalPrice)}</ThemedText>
      </View>

      {appointment.payment ? (
        <View style={styles.paymentRow}>
          <ThemedText themeColor="textSecondary">
            {getPaymentMethodLabel(appointment.payment.method)}
          </ThemedText>
          <PaymentStatusBadge status={appointment.payment.status} />
        </View>
      ) : null}

      <ActionButton label="Abrir cita" onPress={onOpen} variant="secondary" />
    </SurfaceCard>
  );
}

export function AppointmentAgendaScreen({
  barbershopId,
  barberId = null,
}: {
  barbershopId: string | null;
  barberId?: string | null;
}) {
  const theme = useTheme();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<AgendaFilters>({
    period: 'today',
    barberId: null,
    status: null,
    pendingPaymentsOnly: false,
  });
  const load = useCallback(
    () =>
      user && barbershopId
        ? getOperationalAgenda({ userId: user.id, barbershopId, barberId })
        : Promise.resolve(null),
    [barberId, barbershopId, user],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);
  const appointments = useMemo(
    () => filterAgendaAppointments(data?.appointments ?? [], filters),
    [data?.appointments, filters],
  );

  const updateFilters = (next: Partial<AgendaFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await reload();
    setIsRefreshing(false);
  };

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando agenda…</ThemedText>
      </ThemedView>
    );
  }

  if (!barbershopId || !data) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'No tienes acceso a esta agenda.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  const isAdmin = data.role === 'administrator';

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={appointments}
        keyExtractor={(appointment) => appointment.id}
        ListEmptyComponent={
          <SurfaceCard style={styles.emptyCard}>
            <ThemedText style={styles.sectionTitle}>Sin citas en esta vista</ThemedText>
            <ThemedText themeColor="textSecondary">
              Ajusta los filtros o actualiza la agenda para consultar cambios recientes.
            </ThemedText>
          </SurfaceCard>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              description={
                isAdmin
                  ? 'Opera las reservas y pagos de esta barbería.'
                  : 'Consulta y opera únicamente tus citas asignadas.'
              }
              eyebrow={isAdmin ? 'Administración' : 'Barbero'}
              title={isAdmin ? 'Agenda y reservas' : 'Mi agenda'}
            />
            {error ? <StatusMessage message={error} /> : null}

            <SurfaceCard style={styles.filtersCard}>
              <ThemedText style={styles.sectionTitle}>Vista</ThemedText>
              <View style={styles.chipGroup}>
                {PERIODS.map((period) => (
                  <FilterChip
                    key={period.value}
                    label={period.label}
                    onPress={() => updateFilters({ period: period.value })}
                    selected={filters.period === period.value}
                  />
                ))}
                {isAdmin ? (
                  <FilterChip
                    label="Pagos pendientes"
                    onPress={() =>
                      updateFilters({ pendingPaymentsOnly: !filters.pendingPaymentsOnly })
                    }
                    selected={filters.pendingPaymentsOnly}
                  />
                ) : null}
              </View>

              <ThemedText style={styles.filterLabel}>Estado</ThemedText>
              <View style={styles.chipGroup}>
                {STATUSES.map((status) => (
                  <FilterChip
                    key={status.value ?? 'all'}
                    label={status.label}
                    onPress={() => updateFilters({ status: status.value })}
                    selected={filters.status === status.value}
                  />
                ))}
              </View>

              {isAdmin && data.barbers.length > 0 ? (
                <>
                  <ThemedText style={styles.filterLabel}>Barbero</ThemedText>
                  <View style={styles.chipGroup}>
                    <FilterChip
                      label="Todos"
                      onPress={() => updateFilters({ barberId: null })}
                      selected={!filters.barberId}
                    />
                    {data.barbers.map((barber) => (
                      <FilterChip
                        key={barber.id}
                        label={barber.displayName}
                        onPress={() => updateFilters({ barberId: barber.id })}
                        selected={filters.barberId === barber.id}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </SurfaceCard>
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
          <AppointmentCard
            appointment={item}
            onOpen={() =>
              router.push(
                (barberId
                  ? `/barbershops/${barbershopId}/barbers/${barberId}/appointments/${item.id}`
                  : `/barbershops/${barbershopId}/appointments/${item.id}`) as Href,
              )
            }
            showBarber={isAdmin}
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
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.four, paddingBottom: Spacing.three },
  filtersCard: { gap: Spacing.three, padding: Spacing.four },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  filterLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  chipLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  card: { gap: Spacing.three, marginBottom: Spacing.three, padding: Spacing.four },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardTitle: { fontSize: TypeScale.title, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCard: { gap: Spacing.two, padding: Spacing.four },
});

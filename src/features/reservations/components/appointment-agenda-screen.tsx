import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatLimaDate, formatLimaTime, useFocusedResource } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ListScreenSkeleton } from '@/shared/components/ui/list-screen-skeleton';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import {
  clearSecondaryAgendaFilters,
  filterAgendaAppointments,
  getAgendaEmptyStateCopy,
  hasSecondaryAgendaFilters,
  type AgendaFilters,
  type AgendaPeriod,
} from '../appointment-domain';
import { getOperationalAgenda } from '../queries';
import type {
  OperationalAppointment,
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
} from '../types';
import { PaymentStatusBadge, ReservationStatusBadge } from './appointment-status-badge';
import { BarberAppointmentAgenda } from './barber-appointment-agenda';
import { BarberAgendaSkeleton } from './barber-appointment-skeletons';

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

const PAYMENT_STATUSES: readonly { value: PaymentStatus | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'refunded', label: 'Reembolsado' },
  { value: 'failed', label: 'Fallido' },
];

const PAYMENT_METHODS: readonly { value: PaymentMethod | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'yape', label: 'Yape' },
];

type FilterOption = { value: string | null; label: string };

function PeriodSelector({
  period,
  onChange,
}: {
  period: AgendaPeriod;
  onChange: (period: AgendaPeriod) => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [focusedPeriod, setFocusedPeriod] = useState<AgendaPeriod | null>(null);

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.periodSelector, { borderColor: theme.border }]}
    >
      {PERIODS.map((option) => {
        const selected = period === option.value;
        return (
          <Pressable
            accessibilityLabel={`Ver citas: ${option.label}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={option.value}
            onBlur={() => setFocusedPeriod(null)}
            onFocus={() => setFocusedPeriod(option.value)}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.periodOption,
              selected ? { backgroundColor: theme.primary } : null,
              focusedPeriod === option.value
                ? { boxShadow: `inset 0 0 0 2px ${theme.focus}` }
                : null,
              pressed ? { opacity: 0.78 } : null,
              getPressedScaleStyle(pressed, reduceMotion, 0.985),
            ]}
          >
            <ThemedText style={[styles.periodLabel, selected ? { color: theme.onPrimary } : null]}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function AgendaFilterSelect({
  label,
  options,
  value,
  expanded,
  onChange,
  onToggle,
}: {
  label: string;
  options: readonly FilterOption[];
  value: string | null;
  expanded: boolean;
  onChange: (value: string | null) => void;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isTriggerFocused, setIsTriggerFocused] = useState(false);
  const [focusedOption, setFocusedOption] = useState<string | null | undefined>(undefined);
  const currentLabel = options.find((option) => option.value === value)?.label ?? 'Todos';

  return (
    <View style={styles.filterControl}>
      <Pressable
        accessibilityHint="Muestra las opciones disponibles"
        accessibilityLabel={`${label}: ${currentLabel}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onBlur={() => setIsTriggerFocused(false)}
        onFocus={() => setIsTriggerFocused(true)}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.filterTrigger,
          { backgroundColor: theme.inputBackground, borderColor: theme.border },
          isTriggerFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
          pressed ? { backgroundColor: theme.surfaceMuted } : null,
          getPressedScaleStyle(pressed, reduceMotion, 0.992),
        ]}
      >
        <View style={styles.filterCopy}>
          <ThemedText style={styles.filterLabel} themeColor="textSecondary">
            {label}
          </ThemedText>
          <ThemedText numberOfLines={1} style={styles.filterValue}>
            {currentLabel}
          </ThemedText>
        </View>
        <AppIcon
          color={theme.textSecondary}
          name={{
            ios: expanded ? 'chevron.up' : 'chevron.down',
            android: expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down',
            web: expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down',
          }}
          size={20}
        />
      </Pressable>
      {expanded ? (
        <View accessibilityRole="radiogroup" style={styles.filterOptions}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={option.value ?? 'all'}
                onBlur={() => setFocusedOption(undefined)}
                onFocus={() => setFocusedOption(option.value)}
                onPress={() => onChange(option.value)}
                style={({ pressed }) => [
                  styles.filterOption,
                  { borderColor: selected ? theme.primary : theme.border },
                  selected ? { backgroundColor: theme.surfaceMuted } : null,
                  focusedOption === option.value ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
                  pressed ? { opacity: 0.76 } : null,
                  getPressedScaleStyle(pressed, reduceMotion, 0.992),
                ]}
              >
                <ThemedText style={styles.filterOptionLabel}>{option.label}</ThemedText>
                {selected ? (
                  <AppIcon
                    color={theme.primary}
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={18}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function AppointmentCard({
  appointment,
  onOpen,
}: {
  appointment: OperationalAppointment;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const services = appointment.items.map((item) => item.serviceName).join(' · ');
  const isPendingYape =
    appointment.payment?.method === 'yape' && appointment.payment.status === 'pending';

  return (
    <Pressable
      accessibilityHint="Abre el detalle administrativo de esta cita"
      accessibilityLabel={`${formatLimaTime(appointment.startsAt)}, ${appointment.clientContact.fullName ?? 'cliente sin nombre'}, ${appointment.barberName}`}
      accessibilityRole="button"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onOpen}
      style={({ pressed }) => [
        isFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
        getPressedScaleStyle(pressed, reduceMotion, 0.992),
      ]}
    >
      <SurfaceCard style={[styles.card, isPendingYape ? { borderColor: theme.warning } : null]}>
        <View style={styles.cardMain}>
          <View style={styles.timeColumn}>
            <ThemedText style={styles.cardTime}>{formatLimaTime(appointment.startsAt)}</ThemedText>
            <ThemedText numberOfLines={1} style={styles.cardDate} themeColor="textSecondary">
              {formatLimaDate(appointment.startsAt)}
            </ThemedText>
          </View>
          <View style={styles.cardCopy}>
            <ThemedText numberOfLines={1} style={styles.clientName}>
              {appointment.clientContact.fullName ?? 'Cliente sin nombre registrado'}
            </ThemedText>
            <ThemedText numberOfLines={1} style={styles.cardMeta} themeColor="textSecondary">
              Con {appointment.barberName}
            </ThemedText>
            <ThemedText numberOfLines={2} style={styles.services} themeColor="textSecondary">
              {services || 'Servicios reservados'}
            </ThemedText>
          </View>
          <AppIcon
            color={theme.textSecondary}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={20}
          />
        </View>
        <View style={styles.statusRow}>
          <ReservationStatusBadge status={appointment.status} />
          {appointment.payment ? <PaymentStatusBadge status={appointment.payment.status} /> : null}
          {isPendingYape ? (
            <ThemedText style={[styles.pendingYape, { color: theme.warning }]}>Yape</ThemedText>
          ) : null}
        </View>
      </SurfaceCard>
    </Pressable>
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
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [isClearFocused, setIsClearFocused] = useState(false);
  const [filters, setFilters] = useState<AgendaFilters>({
    period: 'today',
    barberId: null,
    status: null,
    paymentStatus: null,
    paymentMethod: null,
  });
  const load = useCallback(
    () =>
      user && barbershopId
        ? getOperationalAgenda({ userId: user.id, barbershopId, barberId, period: filters.period })
        : Promise.resolve(null),
    [barberId, barbershopId, filters.period, user],
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
    try {
      await reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !data) {
    if (barberId) return <BarberAgendaSkeleton />;
    return <ListScreenSkeleton rows={4} />;
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

  if (!isAdmin && barberId) {
    return (
      <BarberAppointmentAgenda
        appointments={appointments}
        error={error}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onOpenAppointment={(reservationId) =>
          router.push(
            `/barbershops/${barbershopId}/barbers/${barberId}/appointments/${reservationId}` as Href,
          )
        }
        onPeriodChange={(period) => updateFilters({ period })}
        onRefresh={() => void refresh()}
        onStatusChange={(status) => updateFilters({ status })}
        period={filters.period}
        status={filters.status}
      />
    );
  }

  const hasSecondaryFilters = hasSecondaryAgendaFilters(filters);
  const emptyCopy = getAgendaEmptyStateCopy(filters.period, hasSecondaryFilters);
  const barberOptions: FilterOption[] = [
    { value: null, label: 'Todos' },
    ...data.barbers.map((barber) => ({ value: barber.id, label: barber.displayName })),
  ];

  const selectFilter = (next: Partial<AgendaFilters>) => {
    updateFilters(next);
    setExpandedFilter(null);
  };

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={appointments}
        keyExtractor={(appointment) => appointment.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
              <AppIcon
                color={theme.primary}
                name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                size={24}
              />
            </View>
            <ThemedText style={styles.sectionTitle}>{emptyCopy.title}</ThemedText>
            <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
              {emptyCopy.description}
            </ThemedText>
            {hasSecondaryFilters ? (
              <ActionButton
                label="Limpiar filtros"
                onPress={() => setFilters(clearSecondaryAgendaFilters(filters))}
                size="compact"
                variant="secondary"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenHeading
              compact
              description="Consulta y opera todas las citas de esta barbería."
              eyebrow="Administración"
              title="Agenda"
            />
            {error ? <StatusMessage message={error} /> : null}

            <PeriodSelector
              onChange={(period) => updateFilters({ period })}
              period={filters.period}
            />

            <SurfaceCard style={styles.filtersCard}>
              <View style={styles.filtersHeading}>
                <View style={styles.filtersCopy}>
                  <ThemedText style={styles.sectionTitle}>Filtros</ThemedText>
                  <ThemedText style={styles.filterSummary} themeColor="textSecondary">
                    {hasSecondaryFilters
                      ? 'Mostrando una vista filtrada'
                      : 'Todas las citas del período'}
                  </ThemedText>
                </View>
                {hasSecondaryFilters ? (
                  <Pressable
                    accessibilityRole="button"
                    onBlur={() => setIsClearFocused(false)}
                    onFocus={() => setIsClearFocused(true)}
                    onPress={() => setFilters(clearSecondaryAgendaFilters(filters))}
                    style={({ pressed }) => [
                      styles.clearFilters,
                      isClearFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
                      pressed ? { opacity: 0.72 } : null,
                    ]}
                  >
                    <ThemedText style={[styles.clearFiltersLabel, { color: theme.primary }]}>
                      Limpiar
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>

              <AgendaFilterSelect
                expanded={expandedFilter === 'barber'}
                label="Barbero"
                onChange={(value) => selectFilter({ barberId: value })}
                onToggle={() =>
                  setExpandedFilter((current) => (current === 'barber' ? null : 'barber'))
                }
                options={barberOptions}
                value={filters.barberId}
              />
              <AgendaFilterSelect
                expanded={expandedFilter === 'status'}
                label="Estado de cita"
                onChange={(value) => selectFilter({ status: value as ReservationStatus | null })}
                onToggle={() =>
                  setExpandedFilter((current) => (current === 'status' ? null : 'status'))
                }
                options={STATUSES}
                value={filters.status}
              />
              <AgendaFilterSelect
                expanded={expandedFilter === 'payment'}
                label="Estado de pago"
                onChange={(value) => selectFilter({ paymentStatus: value as PaymentStatus | null })}
                onToggle={() =>
                  setExpandedFilter((current) => (current === 'payment' ? null : 'payment'))
                }
                options={PAYMENT_STATUSES}
                value={filters.paymentStatus}
              />
              <AgendaFilterSelect
                expanded={expandedFilter === 'method'}
                label="Método"
                onChange={(value) => selectFilter({ paymentMethod: value as PaymentMethod | null })}
                onToggle={() =>
                  setExpandedFilter((current) => (current === 'method' ? null : 'method'))
                }
                options={PAYMENT_METHODS}
                value={filters.paymentMethod}
              />
            </SurfaceCard>

            <View style={styles.resultsHeading}>
              <ThemedText style={styles.sectionTitle}>Citas</ThemedText>
              <ThemedText style={styles.resultCount} themeColor="textSecondary">
                {appointments.length}
              </ThemedText>
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
          <AppointmentCard
            appointment={item}
            onOpen={() =>
              router.push(`/barbershops/${barbershopId}/appointments/${item.id}` as Href)
            }
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
    maxWidth: Layout.feedMaxWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.four, paddingBottom: Spacing.three },
  periodSelector: {
    minHeight: 52,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  periodOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  periodLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  filtersCard: { gap: Spacing.two, padding: Spacing.three },
  filtersHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.one,
  },
  filtersCopy: { flex: 1, gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  filterSummary: { fontSize: TypeScale.caption },
  clearFilters: { minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.two },
  clearFiltersLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  filterControl: { gap: Spacing.two },
  filterTrigger: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  filterCopy: { flex: 1, gap: 2 },
  filterLabel: { fontSize: TypeScale.caption, fontWeight: '600' },
  filterValue: { fontSize: TypeScale.label, fontWeight: '700' },
  filterOptions: { gap: Spacing.two, paddingBottom: Spacing.two },
  filterOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  filterOptionLabel: { flex: 1, fontSize: TypeScale.label, fontWeight: '600' },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { fontSize: TypeScale.label, fontWeight: '700' },
  card: { gap: Spacing.three, marginBottom: Spacing.three, padding: Spacing.three },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  timeColumn: { width: 72, gap: Spacing.one },
  cardTime: { fontSize: TypeScale.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
  cardDate: { fontSize: TypeScale.caption, lineHeight: 18 },
  cardCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  clientName: { fontSize: TypeScale.body, fontWeight: '700' },
  cardMeta: { fontSize: TypeScale.label },
  services: { fontSize: TypeScale.caption, lineHeight: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  pendingYape: { fontSize: TypeScale.caption, fontWeight: '800' },
  emptyState: { alignItems: 'flex-start', gap: Spacing.two, paddingVertical: Spacing.four },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  emptyDescription: { maxWidth: 480, fontSize: TypeScale.label, lineHeight: 21 },
});

import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type AccessibilityRole,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { formatLimaDate, formatLimaTime } from '@/features/booking';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion, Radius, TypeScale } from '@/theme/tokens';

import { getAgendaEmptyStateCopy, type AgendaPeriod } from '../appointment-domain';
import {
  getPaymentMethodLabel,
  getReservationServiceSummary,
  getReservationStatusLabel,
} from '../reservation-domain';
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

type BarberAppointmentAgendaProps = {
  appointments: readonly OperationalAppointment[];
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  period: AgendaPeriod;
  status: ReservationStatus | null;
  onOpenAppointment: (reservationId: string) => void;
  onPeriodChange: (period: AgendaPeriod) => void;
  onRefresh: () => void;
  onStatusChange: (status: ReservationStatus | null) => void;
};

function AgendaFilterOption({
  label,
  onPress,
  role,
  selected,
  shape,
}: {
  label: string;
  onPress: () => void;
  role: AccessibilityRole;
  selected: boolean;
  shape: 'period' | 'status';
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const isPeriod = shape === 'period';

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ selected }}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        isPeriod ? styles.periodOption : styles.statusChip,
        !isPeriod ? { backgroundColor: theme.surface, borderColor: theme.border } : null,
        selected && !isPeriod ? { borderColor: theme.primary } : null,
        isFocused ? { boxShadow: `inset 0 0 0 2px ${theme.focus}` } : null,
        pressed ? styles.pressed : null,
        getPressedScaleStyle(pressed, reduceMotion, 0.98),
      ]}
    >
      {selected ? (
        <Animated.View
          entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isPeriod ? theme.surface : theme.primary,
              borderRadius: isPeriod ? Radius.small : Radius.pill,
            },
          ]}
        />
      ) : null}
      <ThemedText
        style={[
          isPeriod ? styles.periodLabel : styles.statusLabel,
          selected ? { color: isPeriod ? theme.primary : theme.onPrimary } : null,
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function PeriodSelector({
  selectedPeriod,
  onChange,
}: {
  selectedPeriod: AgendaPeriod;
  onChange: (period: AgendaPeriod) => void;
}) {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Período de la agenda"
      accessibilityRole="tablist"
      style={[styles.periodSelector, { backgroundColor: theme.surfaceMuted }]}
    >
      {PERIODS.map((period) => {
        const isSelected = period.value === selectedPeriod;
        return (
          <AgendaFilterOption
            key={period.value}
            onPress={() => onChange(period.value)}
            label={period.label}
            role="tab"
            selected={isSelected}
            shape="period"
          />
        );
      })}
    </View>
  );
}

function StatusFilter({
  selectedStatus,
  onChange,
}: {
  selectedStatus: ReservationStatus | null;
  onChange: (status: ReservationStatus | null) => void;
}) {
  return (
    <View style={styles.statusSection}>
      <ThemedText style={styles.filterLabel} themeColor="textSecondary">
        Estado
      </ThemedText>
      <ScrollView
        contentContainerStyle={styles.statusContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {STATUSES.map((status) => {
          const isSelected = selectedStatus === status.value;
          return (
            <AgendaFilterOption
              key={status.value ?? 'all'}
              label={status.label}
              onPress={() => onChange(status.value)}
              role="button"
              selected={isSelected}
              shape="status"
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function BarberAppointmentCard({
  appointment,
  period,
  onOpen,
}: {
  appointment: OperationalAppointment;
  period: AgendaPeriod;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const clientName = appointment.clientContact.fullName ?? 'Cliente sin nombre registrado';
  const services = getReservationServiceSummary(appointment.items, 3);

  return (
    <Pressable
      accessibilityHint="Abre el detalle operativo de esta cita"
      accessibilityLabel={`${formatLimaTime(appointment.startsAt)}, ${clientName}, ${getReservationStatusLabel(appointment.status)}`}
      accessibilityRole="link"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.appointmentCard,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          borderColor: theme.border,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.992),
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.timeBlock}>
          <ThemedText selectable style={styles.time}>
            {formatLimaTime(appointment.startsAt)}
          </ThemedText>
          {period !== 'today' ? (
            <ThemedText style={styles.date} themeColor="textSecondary">
              {formatLimaDate(appointment.startsAt)}
            </ThemedText>
          ) : null}
        </View>
        <ReservationStatusBadge status={appointment.status} />
      </View>

      <View style={styles.cardBody}>
        <ThemedText numberOfLines={1} style={styles.clientName}>
          {clientName}
        </ThemedText>
        <ThemedText numberOfLines={2} style={styles.services} themeColor="textSecondary">
          {services}
        </ThemedText>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <View style={styles.duration}>
          <AppIcon
            color={theme.textSecondary}
            name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            size={17}
          />
          <ThemedText style={styles.metaLabel} themeColor="textSecondary">
            {appointment.totalDurationMinutes} min
          </ThemedText>
        </View>

        {appointment.payment ? (
          <View style={styles.payment}>
            <ThemedText style={styles.metaLabel} themeColor="textSecondary">
              {getPaymentMethodLabel(appointment.payment.method)}
            </ThemedText>
            <PaymentStatusBadge status={appointment.payment.status} />
          </View>
        ) : null}

        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={18}
        />
      </View>
    </Pressable>
  );
}

function AgendaEmptyState({
  period,
  hasActiveStatusFilter,
}: {
  period: AgendaPeriod;
  hasActiveStatusFilter: boolean;
}) {
  const theme = useTheme();
  const copy = getAgendaEmptyStateCopy(period, hasActiveStatusFilter);

  return (
    <View
      style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon
          color={theme.primary}
          name={{ ios: 'calendar', android: 'event_available', web: 'event_available' }}
          size={25}
        />
      </View>
      <View style={styles.emptyCopy}>
        <ThemedText style={styles.emptyTitle}>{copy.title}</ThemedText>
        <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
          {copy.description}
        </ThemedText>
      </View>
    </View>
  );
}

function AgendaResultsSkeleton() {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Actualizando citas"
      accessibilityRole="progressbar"
      style={styles.resultsSkeleton}
    >
      <View style={[styles.resultSkeletonCard, { backgroundColor: theme.surfaceMuted }]} />
      <View style={[styles.resultSkeletonCard, { backgroundColor: theme.surfaceMuted }]} />
    </View>
  );
}

export function BarberAppointmentAgenda({
  appointments,
  error,
  isLoading,
  isRefreshing,
  period,
  status,
  onOpenAppointment,
  onPeriodChange,
  onRefresh,
  onStatusChange,
}: BarberAppointmentAgendaProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={appointments}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(appointment) => appointment.id}
        ListEmptyComponent={
          isLoading ? (
            <AgendaResultsSkeleton />
          ) : (
            <AgendaEmptyState hasActiveStatusFilter={status !== null} period={period} />
          )
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {error ? <StatusMessage message={error} /> : null}
            <PeriodSelector onChange={onPeriodChange} selectedPeriod={period} />
            <StatusFilter onChange={onStatusChange} selectedStatus={status} />
          </View>
        }
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <BarberAppointmentCard
            appointment={item}
            onOpen={() => onOpenAppointment(item.id)}
            period={period}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.feedMaxWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: { gap: Spacing.four, paddingBottom: Spacing.four },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: Radius.medium,
    padding: Spacing.one,
  },
  periodOption: {
    position: 'relative',
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.small,
    overflow: 'hidden',
    paddingHorizontal: Spacing.two,
  },
  periodLabel: { fontSize: TypeScale.label, fontWeight: '800' },
  statusSection: { gap: Spacing.two },
  filterLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  statusContent: { gap: Spacing.two, paddingRight: Spacing.four },
  statusChip: {
    position: 'relative',
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    paddingHorizontal: Spacing.three,
  },
  statusLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  pressed: { opacity: 0.76 },
  separator: { height: Spacing.three },
  appointmentCard: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  timeBlock: { minWidth: 0, flex: 1, gap: Spacing.one },
  time: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
  },
  date: { fontSize: TypeScale.label, lineHeight: 20 },
  cardBody: { gap: Spacing.one },
  clientName: { fontSize: TypeScale.title, fontWeight: '800', lineHeight: 27 },
  services: { fontSize: TypeScale.label, lineHeight: 21 },
  cardFooter: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  duration: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  payment: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaLabel: { fontSize: TypeScale.label },
  emptyState: {
    minHeight: 124,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  emptyCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  emptyTitle: { fontSize: TypeScale.body, fontWeight: '800', lineHeight: 22 },
  emptyDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  resultsSkeleton: { gap: Spacing.three },
  resultSkeletonCard: { height: 188, borderRadius: Radius.large },
});

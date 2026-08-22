import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { formatLimaDate, formatLimaTime } from '@/features/booking';
import { ReservationStatusBadge } from '@/features/reservations/components/appointment-status-badge';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import type { AdminHomeAppointment } from '../types';

function getServicesSummary(serviceNames: readonly string[]) {
  if (serviceNames.length === 0) return 'Servicios reservados';
  const visibleNames = serviceNames.slice(0, 2);
  const remainingCount = serviceNames.length - visibleNames.length;
  return `${visibleNames.join(', ')}${remainingCount > 0 ? ` +${remainingCount}` : ''}`;
}

const AdminAppointmentRow = memo(function AdminAppointmentRow({
  appointment,
  href,
}: {
  appointment: AdminHomeAppointment;
  href: string;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const clientName = appointment.clientName ?? 'Cliente sin nombre registrado';
  const serviceSummary = getServicesSummary(appointment.serviceNames);

  return (
    <Pressable
      accessibilityHint="Abre el detalle administrativo de la cita"
      accessibilityLabel={`${formatLimaDate(appointment.startsAt)}, ${formatLimaTime(appointment.startsAt)}, ${clientName}, ${appointment.barberName}, ${serviceSummary}`}
      accessibilityRole="link"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onPress={() => router.push(href as Href)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
        },
        getPressedScaleStyle(pressed, reduceMotion, 0.992),
      ]}
    >
      <View style={styles.rowHeading}>
        <View style={styles.dateCopy}>
          <ThemedText selectable style={styles.time}>
            {formatLimaTime(appointment.startsAt)}
          </ThemedText>
          <ThemedText style={styles.date} themeColor="textSecondary">
            {formatLimaDate(appointment.startsAt)}
          </ThemedText>
        </View>
        <ReservationStatusBadge status={appointment.status} />
      </View>
      <ThemedText numberOfLines={1} style={styles.client}>
        {clientName}
      </ThemedText>
      <ThemedText numberOfLines={1} style={styles.meta} themeColor="textSecondary">
        Barbero: {appointment.barberName}
      </ThemedText>
      <View style={styles.rowFooter}>
        <ThemedText numberOfLines={1} style={styles.services} themeColor="textSecondary">
          {serviceSummary}
        </ThemedText>
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
        />
      </View>
    </Pressable>
  );
});

export function AdminUpcomingAppointments({
  appointments,
  appointmentHref,
  onOpenAgenda,
  onRetry,
}: {
  appointments: readonly AdminHomeAppointment[] | null;
  appointmentHref: (reservationId: string) => string;
  onOpenAgenda: () => void;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isAgendaFocused, setIsAgendaFocused] = useState(false);
  const [isRetryFocused, setIsRetryFocused] = useState(false);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
          Próximas citas
        </ThemedText>
        <Pressable
          accessibilityRole="link"
          onBlur={() => setIsAgendaFocused(false)}
          onFocus={() => setIsAgendaFocused(true)}
          onPress={onOpenAgenda}
          style={({ pressed }) => [
            styles.headerAction,
            isAgendaFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
            getPressedScaleStyle(pressed, reduceMotion, 0.98),
          ]}
        >
          <ThemedText style={styles.headerActionLabel} themeColor="primary">
            Agenda completa
          </ThemedText>
        </Pressable>
      </View>

      {appointments === null ? (
        <View style={styles.error}>
          <StatusMessage message="No pudimos cargar las próximas citas." />
          <Pressable
            accessibilityRole="button"
            onBlur={() => setIsRetryFocused(false)}
            onFocus={() => setIsRetryFocused(true)}
            onPress={onRetry}
            style={[
              styles.retryButton,
              isRetryFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
            ]}
          >
            <ThemedText style={styles.retryLabel} themeColor="primary">
              Reintentar
            </ThemedText>
          </Pressable>
        </View>
      ) : appointments.length > 0 ? (
        <SurfaceCard style={styles.list}>
          {appointments.map((appointment, index) => (
            <View key={appointment.id}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              ) : null}
              <AdminAppointmentRow
                appointment={appointment}
                href={appointmentHref(appointment.id)}
              />
            </View>
          ))}
        </SurfaceCard>
      ) : (
        <View style={[styles.empty, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.emptyTitle}>Sin citas próximas</ThemedText>
          <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
            Las nuevas reservas de esta barbería aparecerán aquí.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  sectionHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionTitle: { flex: 1, fontSize: TypeScale.title, fontWeight: '700', letterSpacing: -0.3 },
  headerAction: { minHeight: 48, justifyContent: 'center', paddingLeft: Spacing.two },
  headerActionLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  list: { overflow: 'hidden' },
  row: { minHeight: 136, gap: Spacing.one, padding: Spacing.three },
  rowHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  dateCopy: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  time: { fontSize: TypeScale.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
  date: { minWidth: 0, flex: 1, fontSize: TypeScale.caption, fontWeight: '700' },
  client: { paddingTop: Spacing.one, fontSize: TypeScale.body, fontWeight: '700' },
  meta: { fontSize: TypeScale.label, lineHeight: 20 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  services: { minWidth: 0, flex: 1, fontSize: TypeScale.caption, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.three },
  empty: {
    minHeight: 100,
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  emptyTitle: { fontSize: TypeScale.body, fontWeight: '700' },
  emptyDescription: { fontSize: TypeScale.label, lineHeight: 20 },
  error: { gap: Spacing.two },
  retryButton: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center' },
  retryLabel: { fontSize: TypeScale.label, fontWeight: '700' },
});

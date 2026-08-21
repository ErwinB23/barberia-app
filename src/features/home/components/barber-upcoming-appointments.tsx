import { memo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { formatLimaTime } from '@/features/booking';
import { ReservationStatusBadge } from '@/features/reservations/components/appointment-status-badge';
import type { OperationalAppointment, ReservationStatus } from '@/features/reservations/types';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { getReservationServicesSummary } from '../client-home-domain';

const BarberAppointmentRow = memo(function BarberAppointmentRow({
  clientName,
  href,
  services,
  startsAt,
  status,
}: {
  clientName: string;
  href: string;
  services: string;
  startsAt: string;
  status: ReservationStatus;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Pressable
      accessibilityHint="Abre el detalle operativo de la cita"
      accessibilityLabel={`${formatLimaTime(startsAt)}, ${clientName}, ${services}`}
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
      <ThemedText selectable style={styles.time}>
        {formatLimaTime(startsAt)}
      </ThemedText>
      <View style={styles.rowCopy}>
        <ThemedText numberOfLines={1} style={styles.client}>
          {clientName}
        </ThemedText>
        <ThemedText numberOfLines={1} style={styles.services} themeColor="textSecondary">
          {services}
        </ThemedText>
      </View>
      <View style={styles.rowEnd}>
        <ReservationStatusBadge status={status} />
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
        />
      </View>
    </Pressable>
  );
});

export function BarberUpcomingAppointments({
  appointments,
  appointmentHref,
  onOpenAgenda,
}: {
  appointments: readonly OperationalAppointment[];
  appointmentHref: (reservationId: string) => string;
  onOpenAgenda: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
          Después
        </ThemedText>
        <Pressable
          accessibilityRole="link"
          onPress={onOpenAgenda}
          style={({ pressed }) => [styles.agendaLink, pressed ? styles.pressed : null]}
        >
          <ThemedText style={styles.agendaLinkLabel} themeColor="primary">
            Ver agenda completa
          </ThemedText>
        </Pressable>
      </View>

      {appointments.length > 0 ? (
        <SurfaceCard style={styles.list}>
          {appointments.map((appointment, index) => (
            <View key={appointment.id}>
              {index > 0 ? (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              ) : null}
              <BarberAppointmentRow
                clientName={appointment.clientContact.fullName ?? 'Cliente sin nombre registrado'}
                href={appointmentHref(appointment.id)}
                services={
                  getReservationServicesSummary(appointment.items) ?? 'Servicios reservados'
                }
                startsAt={appointment.startsAt}
                status={appointment.status}
              />
            </View>
          ))}
        </SurfaceCard>
      ) : (
        <View style={[styles.empty, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.emptyTitle}>Sin más citas programadas</ThemedText>
          <ThemedText style={styles.emptyDescription} themeColor="textSecondary">
            Revisa la agenda completa para consultar otros días.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  sectionHeader: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  sectionTitle: {
    flex: 1,
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  agendaLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: Spacing.two,
  },
  agendaLinkLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  list: {
    overflow: 'hidden',
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  time: {
    width: 50,
    fontSize: TypeScale.body,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  rowCopy: {
    minWidth: 0,
    flex: 1,
    gap: Spacing.one,
  },
  client: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  services: {
    fontSize: TypeScale.caption,
    lineHeight: 18,
  },
  rowEnd: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
  },
  empty: {
    minHeight: 92,
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Radius.large,
    padding: Spacing.three,
  },
  emptyTitle: {
    fontSize: TypeScale.body,
    fontWeight: '700',
  },
  emptyDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.68,
  },
});

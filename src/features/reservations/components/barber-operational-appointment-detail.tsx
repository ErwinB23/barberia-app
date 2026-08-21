import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { formatLimaDate, formatLimaTime, formatPen } from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion, Radius, TypeScale } from '@/theme/tokens';

import {
  getBarberAppointmentControls,
  type BarberAppointmentControls,
  type OperationalActions,
} from '../appointment-domain';
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../reservation-domain';
import type { OperationalAppointment, ReservationStatus } from '../types';
import { APPOINTMENT_ACTION_COPY, type AppointmentAction } from './appointment-action-copy';
import { PaymentStatusBadge, ReservationStatusBadge } from './appointment-status-badge';

type BarberOperationalAppointmentDetailProps = {
  appointment: OperationalAppointment;
  actions: OperationalActions;
  confirmation: AppointmentAction | null;
  error: string | null;
  feedback: string | null;
  isMutating: boolean;
  isRefreshing: boolean;
  onCancelConfirmation: () => void;
  onConfirmAction: (action: AppointmentAction) => void;
  onRefresh: () => void;
  onRequestAction: (action: AppointmentAction) => void;
};

type BarberActionSectionProps = {
  appointment: OperationalAppointment;
  confirmation: AppointmentAction | null;
  controls: BarberAppointmentControls;
  isMutating: boolean;
  onCancelConfirmation: () => void;
  onConfirmAction: (action: AppointmentAction) => void;
  onRequestAction: (action: AppointmentAction) => void;
};

function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <ThemedText style={styles.factLabel} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText selectable style={styles.factValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function ActionConfirmation({
  action,
  isMutating,
  onCancel,
  onConfirm,
}: {
  action: AppointmentAction;
  isMutating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  const copy = APPOINTMENT_ACTION_COPY[action];
  const isDestructive = action === 'no_show' || action === 'refund';

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
      exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
      style={[
        styles.confirmation,
        {
          backgroundColor: isDestructive ? theme.dangerSurface : theme.surfaceMuted,
          borderColor: isDestructive ? theme.danger : theme.border,
        },
      ]}
    >
      <ThemedText style={styles.confirmationTitle}>{copy.label}</ThemedText>
      <ThemedText style={styles.confirmationCopy} themeColor="textSecondary">
        {copy.confirmation}
      </ThemedText>
      <ActionButton
        isLoading={isMutating}
        label={copy.confirmLabel}
        onPress={onConfirm}
        variant={isDestructive ? 'danger' : 'primary'}
      />
      <ActionButton disabled={isMutating} label="Volver" onPress={onCancel} variant="secondary" />
    </Animated.View>
  );
}

function AppointmentHero({ appointment }: { appointment: OperationalAppointment }) {
  const theme = useTheme();

  return (
    <SurfaceCard elevated style={[styles.heroCard, { borderColor: theme.primary }]}>
      <View style={styles.heroTopRow}>
        <View style={styles.dateBlock}>
          <ThemedText style={styles.date} themeColor="textSecondary">
            {formatLimaDate(appointment.startsAt)}
          </ThemedText>
          <ThemedText selectable style={styles.time} themeColor="primary">
            {formatLimaTime(appointment.startsAt)} - {formatLimaTime(appointment.endsAt)}
          </ThemedText>
        </View>
        <ReservationStatusBadge status={appointment.status} />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.clientBlock}>
        <View style={[styles.clientIcon, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'person.crop.circle', android: 'person', web: 'person' }}
            size={23}
          />
        </View>
        <View style={styles.clientCopy}>
          <ThemedText style={styles.clientLabel} themeColor="textSecondary">
            Cliente
          </ThemedText>
          <ThemedText selectable style={styles.clientName}>
            {appointment.clientContact.fullName ?? 'Cliente sin nombre registrado'}
          </ThemedText>
          <ThemedText selectable style={styles.clientPhone} themeColor="textSecondary">
            {appointment.clientContact.phone ?? 'Teléfono no registrado'}
          </ThemedText>
        </View>
      </View>
    </SurfaceCard>
  );
}

function AppointmentServices({ appointment }: { appointment: OperationalAppointment }) {
  const theme = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.surfaceMuted }]}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
            size={20}
          />
        </View>
        <View style={styles.sectionHeadingCopy}>
          <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
            Servicios
          </ThemedText>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            Datos guardados al crear la reserva.
          </ThemedText>
        </View>
      </View>

      {appointment.items.length > 0 ? (
        <View>
          {appointment.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.serviceRow,
                index > 0
                  ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }
                  : null,
              ]}
            >
              <View style={styles.serviceCopy}>
                <ThemedText style={styles.serviceName}>{item.serviceName}</ThemedText>
                {item.styleName ? (
                  <ThemedText style={styles.serviceStyle} themeColor="textSecondary">
                    Estilo: {item.styleName}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText selectable style={styles.serviceDuration} themeColor="textSecondary">
                {item.durationAtBooking} min
              </ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
          No pudimos mostrar el detalle de los servicios. La información principal de la cita sigue
          disponible.
        </ThemedText>
      )}
    </SurfaceCard>
  );
}

function AppointmentSummary({ appointment }: { appointment: OperationalAppointment }) {
  return (
    <SurfaceCard style={styles.card}>
      <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
        Resumen de la cita
      </ThemedText>
      <View style={styles.factGrid}>
        <DetailFact label="Duración" value={`${appointment.totalDurationMinutes} min`} />
        <DetailFact label="Total" value={formatPen(appointment.totalPrice)} />
        <DetailFact label="Barbería" value={appointment.barbershopName} />
        <DetailFact label="Profesional" value={appointment.barberName} />
      </View>
    </SurfaceCard>
  );
}

function PaymentSection({
  appointment,
  controls,
  confirmation,
  isMutating,
  onCancelConfirmation,
  onConfirmAction,
  onRequestAction,
}: BarberActionSectionProps) {
  const theme = useTheme();
  const payment = appointment.payment;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.paymentHeading}>
        <View style={styles.sectionHeadingCopy}>
          <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
            Pago
          </ThemedText>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            Estado visible para esta atención.
          </ThemedText>
        </View>
        {payment ? <PaymentStatusBadge status={payment.status} /> : null}
      </View>

      {payment ? (
        <>
          <View style={styles.factGrid}>
            <DetailFact label="Método" value={getPaymentMethodLabel(payment.method)} />
            <DetailFact label="Estado" value={getPaymentStatusLabel(payment.status)} />
            <DetailFact label="Importe" value={formatPen(payment.amount)} />
          </View>

          {controls.paymentGuidance ? (
            <View style={[styles.guidance, { backgroundColor: theme.warningSurface }]}>
              <AppIcon
                color={theme.warning}
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={19}
              />
              <ThemedText style={styles.guidanceCopy}>{controls.paymentGuidance}</ThemedText>
            </View>
          ) : null}

          {confirmation === 'cash' ? (
            <ActionConfirmation
              action="cash"
              isMutating={isMutating}
              onCancel={onCancelConfirmation}
              onConfirm={() => onConfirmAction('cash')}
            />
          ) : controls.canConfirmCash ? (
            <ActionButton
              disabled={confirmation !== null}
              label="Confirmar pago en efectivo"
              onPress={() => onRequestAction('cash')}
              variant="secondary"
            />
          ) : null}
        </>
      ) : (
        <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
          No hay un pago asociado visible.
        </ThemedText>
      )}
    </SurfaceCard>
  );
}

function getFinalStateCopy(status: ReservationStatus) {
  const copy: Partial<Record<ReservationStatus, string>> = {
    completed: 'La atención está completada. No hay acciones operativas pendientes.',
    cancelled: 'La cita fue cancelada. Se conserva como información histórica.',
    no_show: 'La cita quedó registrada como No asistió.',
  };
  return copy[status] ?? 'No hay acciones operativas disponibles en este momento.';
}

function OperationalActionsSection({
  appointment,
  controls,
  confirmation,
  isMutating,
  onCancelConfirmation,
  onConfirmAction,
  onRequestAction,
}: BarberActionSectionProps) {
  const theme = useTheme();
  const primaryAction = controls.primaryAction;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.sectionHeadingCopy}>
        <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
          Atención
        </ThemedText>
        <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
          La acción disponible depende del estado actual de la cita.
        </ThemedText>
      </View>

      {primaryAction && confirmation === primaryAction ? (
        <ActionConfirmation
          action={primaryAction}
          isMutating={isMutating}
          onCancel={onCancelConfirmation}
          onConfirm={() => onConfirmAction(primaryAction)}
        />
      ) : primaryAction ? (
        <ActionButton
          disabled={confirmation !== null}
          label={APPOINTMENT_ACTION_COPY[primaryAction].label}
          onPress={() => onRequestAction(primaryAction)}
        />
      ) : (
        <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
          {getFinalStateCopy(appointment.status)}
        </ThemedText>
      )}

      {appointment.status === 'confirmed' ? (
        <View style={[styles.noShowSection, { borderTopColor: theme.border }]}>
          <ThemedText style={styles.noShowTitle}>Ausencia del cliente</ThemedText>
          {confirmation === 'no_show' ? (
            <ActionConfirmation
              action="no_show"
              isMutating={isMutating}
              onCancel={onCancelConfirmation}
              onConfirm={() => onConfirmAction('no_show')}
            />
          ) : controls.canMarkNoShow ? (
            <>
              <ThemedText style={styles.noShowCopy} themeColor="textSecondary">
                La tolerancia de 10 minutos terminó. Confirma esta acción solo si el cliente no se
                presentó.
              </ThemedText>
              <ActionButton
                disabled={confirmation !== null}
                label="Marcar como no asistió"
                onPress={() => onRequestAction('no_show')}
                size="compact"
                variant="danger"
              />
            </>
          ) : (
            <ThemedText style={styles.noShowCopy} themeColor="textSecondary">
              Esta opción se habilita después de los 10 minutos de tolerancia.
            </ThemedText>
          )}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

export function BarberOperationalAppointmentDetail({
  appointment,
  actions,
  confirmation,
  error,
  feedback,
  isMutating,
  isRefreshing,
  onCancelConfirmation,
  onConfirmAction,
  onRefresh,
  onRequestAction,
}: BarberOperationalAppointmentDetailProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= Layout.wideBreakpoint;
  const controls = getBarberAppointmentControls(
    actions,
    appointment.payment?.method ?? null,
    appointment.payment?.status ?? null,
  );

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
      >
        {feedback || error ? (
          <Animated.View
            entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.duration(Motion.exit).reduceMotion(ReduceMotion.System)}
            style={styles.heading}
          >
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {error ? <StatusMessage message={error} /> : null}
          </Animated.View>
        ) : null}

        <View style={[styles.layout, isWide ? styles.wideLayout : null]}>
          <View style={styles.mainColumn}>
            <AppointmentHero appointment={appointment} />
            <AppointmentServices appointment={appointment} />
            <AppointmentSummary appointment={appointment} />
          </View>
          <View style={styles.sideColumn}>
            <OperationalActionsSection
              appointment={appointment}
              confirmation={confirmation}
              controls={controls}
              isMutating={isMutating}
              onCancelConfirmation={onCancelConfirmation}
              onConfirmAction={onConfirmAction}
              onRequestAction={onRequestAction}
            />
            <PaymentSection
              appointment={appointment}
              confirmation={confirmation}
              controls={controls}
              isMutating={isMutating}
              onCancelConfirmation={onCancelConfirmation}
              onConfirmAction={onConfirmAction}
              onRequestAction={onRequestAction}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  heading: { maxWidth: Layout.contentMaxWidth, gap: Spacing.three },
  layout: { gap: Spacing.four },
  wideLayout: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { minWidth: 0, flex: 1.25, gap: Spacing.four },
  sideColumn: { minWidth: 0, flex: 0.75, gap: Spacing.four },
  heroCard: { gap: Spacing.four, padding: Spacing.four },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  dateBlock: { minWidth: 0, flex: 1, gap: Spacing.one },
  date: { fontSize: TypeScale.label, fontWeight: '700', lineHeight: 20 },
  time: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
  },
  divider: { height: StyleSheet.hairlineWidth },
  clientBlock: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  clientIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  clientCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  clientLabel: { fontSize: TypeScale.caption },
  clientName: { fontSize: TypeScale.title, fontWeight: '800', lineHeight: 27 },
  clientPhone: { fontSize: TypeScale.body, lineHeight: 23 },
  card: { gap: Spacing.three, padding: Spacing.four },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  sectionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  sectionHeadingCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '800', lineHeight: 27 },
  sectionDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  serviceRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  serviceCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  serviceName: { fontSize: TypeScale.body, fontWeight: '800', lineHeight: 22 },
  serviceStyle: { fontSize: TypeScale.label, lineHeight: 20 },
  serviceDuration: { fontSize: TypeScale.label, fontVariant: ['tabular-nums'] },
  factGrid: { gap: Spacing.three },
  fact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  factLabel: { flexShrink: 0, fontSize: TypeScale.label, lineHeight: 21 },
  factValue: {
    minWidth: 0,
    flex: 1,
    fontSize: TypeScale.label,
    fontWeight: '800',
    lineHeight: 21,
    textAlign: 'right',
  },
  paymentHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  guidance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  guidanceCopy: { minWidth: 0, flex: 1, fontSize: TypeScale.label, lineHeight: 21 },
  confirmation: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  confirmationTitle: { fontSize: TypeScale.body, fontWeight: '800', lineHeight: 22 },
  confirmationCopy: { fontSize: TypeScale.label, lineHeight: 21 },
  noShowSection: {
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  noShowTitle: { fontSize: TypeScale.label, fontWeight: '800' },
  noShowCopy: { fontSize: TypeScale.label, lineHeight: 21 },
});

import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  BookingBarberStep,
  BookingScheduleStep,
  formatLimaDate,
  formatLimaTime,
  getBookingCatalog,
  getBookingDateRange,
  getBookingErrorMessage,
  getEligibleBarberIds,
  getTodayInLima,
  useFocusedResource,
  type AvailableSlot,
} from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { getRescheduleAvailableSlots, rescheduleReservation } from '../actions';
import { getReservationErrorMessage } from '../errors';
import { getClientReservation } from '../queries';
import {
  buildRescheduleReview,
  canRescheduleReservation,
  getClientReservationHref,
  getReservationServiceSummary,
} from '../reservation-domain';
import type { ClientReservation } from '../types';
import { ReservationDetailSkeleton, ReservationLoadError } from './reservation-screen-states';

export function RescheduleReservationScreen({ reservationId }: { reservationId: string | null }) {
  const theme = useTheme();
  const { user } = useAuth();
  const availabilityRequestId = useRef(0);
  const isSubmittingRef = useRef(false);
  const [barberChoice, setBarberChoice] = useState<'any' | string>('any');
  const [date, setDate] = useState(getTodayInLima);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user || !reservationId) return null;
    const reservation = await getClientReservation(user.id, reservationId);
    if (!reservation) return null;
    const catalog = await getBookingCatalog(reservation.barbershopId);
    return { reservation, catalog };
  }, [reservationId, user]);
  const { data, isLoading, error, reload } = useFocusedResource(load);

  const eligibleBarberIds = useMemo(() => {
    if (!data?.catalog) return [];
    return getEligibleBarberIds(
      data.reservation.items.map((item) => item.serviceId),
      data.catalog.barbers.map((barber) => barber.id),
      data.catalog.assignments,
    );
  }, [data]);
  const bookingDates = useMemo(
    () =>
      data?.catalog ? getBookingDateRange(getTodayInLima(), data.catalog.rules.maxBookingDays) : [],
    [data],
  );

  const resetAvailability = () => {
    availabilityRequestId.current += 1;
    setIsChecking(false);
    setSlots([]);
    setSelectedSlot(null);
    setHasCheckedAvailability(false);
    setAvailabilityError(null);
    setFormError(null);
  };

  const checkAvailability = async (targetDate = date) => {
    if (!data?.catalog) return;
    const barberIds = barberChoice === 'any' ? eligibleBarberIds : [barberChoice];
    if (barberIds.length === 0 || !barberIds.every((id) => eligibleBarberIds.includes(id))) {
      setFormError('Elige un profesional que pueda realizar todos los servicios de la reserva.');
      return;
    }
    if (!bookingDates.includes(targetDate)) {
      setAvailabilityError('Elige una fecha dentro del rango permitido por la barbería.');
      return;
    }

    const requestId = ++availabilityRequestId.current;
    setIsChecking(true);
    setHasCheckedAvailability(false);
    setAvailabilityError(null);
    setFormError(null);
    setSelectedSlot(null);
    try {
      const results = await Promise.allSettled(
        barberIds.map((barberId) =>
          getRescheduleAvailableSlots(data.reservation.id, barberId, targetDate),
        ),
      );
      if (requestId !== availabilityRequestId.current) return;

      const availableSlots = results
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
      const firstFailure = results.find((result) => result.status === 'rejected');
      if (availableSlots.length === 0 && firstFailure?.status === 'rejected') {
        throw firstFailure.reason;
      }

      setSlots(availableSlots);
      setHasCheckedAvailability(true);
    } catch (availabilityFailure) {
      setSlots([]);
      setHasCheckedAvailability(true);
      setAvailabilityError(getBookingErrorMessage(availabilityFailure));
    } finally {
      if (requestId === availabilityRequestId.current) setIsChecking(false);
    }
  };

  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    resetAvailability();
    void checkAvailability(nextDate);
  };

  const submit = async () => {
    if (!data || !selectedSlot || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await rescheduleReservation({
        reservationId: data.reservation.id,
        barberId: selectedSlot.barberId,
        startsAt: selectedSlot.startsAt,
      });
      router.replace(getClientReservationHref(data.reservation.id) as Href);
    } catch (mutationError) {
      resetAvailability();
      setFormError(getReservationErrorMessage(mutationError));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading && data === null) return <ReservationDetailSkeleton />;

  if (reservationId && data?.reservation.itemsUnavailable) {
    return (
      <ReservationLoadError
        description="Necesitamos los servicios originales para validar qué profesionales pueden atenderte."
        message="No pudimos cargar los servicios de la reserva. Intenta nuevamente antes de elegir otro turno."
        onBack={() => router.replace(getClientReservationHref(reservationId) as Href)}
        onRetry={() => void reload()}
        title="No pudimos preparar la reprogramación"
      />
    );
  }

  if (
    !reservationId ||
    !data ||
    !data.catalog ||
    data.catalog.barbershop.status !== 'published' ||
    !canRescheduleReservation(data.reservation)
  ) {
    return (
      <ReservationLoadError
        description="Vuelve al detalle para revisar el estado actual y las opciones disponibles."
        message={
          error ??
          'Esta reserva debe estar confirmada, ser futura y conservar disponible su única reprogramación.'
        }
        onBack={() =>
          reservationId
            ? router.replace(getClientReservationHref(reservationId) as Href)
            : router.replace('/reservations' as Href)
        }
        onRetry={error ? () => void reload() : undefined}
        title="No puedes reprogramar esta cita"
      />
    );
  }

  const selectedBarber = selectedSlot
    ? data.catalog.barbers.find((barber) => barber.id === selectedSlot.barberId)
    : null;
  const review = selectedSlot
    ? buildRescheduleReview(data.reservation, {
        startsAt: selectedSlot.startsAt,
        barberName: selectedBarber?.displayName ?? 'Profesional disponible',
      })
    : null;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeading
          description="Puedes cambiar la fecha, la hora y el profesional. Los servicios contratados no se modifican."
          eyebrow="Una única vez"
          title="Reprogramar cita"
        />
        {error || formError ? <StatusMessage message={formError ?? error!} /> : null}

        <SurfaceCard style={styles.frozenCard}>
          <View style={[styles.lockIcon, { backgroundColor: theme.surfaceMuted }]}>
            <AppIcon
              color={theme.primary}
              name={{ ios: 'lock', android: 'lock', web: 'lock' }}
              size={20}
            />
          </View>
          <View style={styles.frozenCopy}>
            <ThemedText style={styles.frozenTitle}>Servicios sin cambios</ThemedText>
            <ThemedText style={styles.frozenDescription} themeColor="textSecondary">
              {getReservationServiceSummary(data.reservation.items, 10)}. Se mantienen el precio y
              la duración originales.
            </ThemedText>
          </View>
        </SurfaceCard>

        <CurrentAppointment reservation={data.reservation} />

        <BookingBarberStep
          anyOptionDescription="Consulta todos los profesionales que pueden realizar los servicios originales."
          barberChoice={barberChoice}
          barbers={data.catalog.barbers}
          description="Puedes mantener al profesional actual o elegir otro compatible con todos tus servicios."
          eligibleBarberIds={eligibleBarberIds}
          onSelectBarber={(value) => {
            setBarberChoice(value);
            resetAvailability();
          }}
          title="Elige al profesional"
        />

        <ActionButton
          disabled={eligibleBarberIds.length === 0}
          isLoading={isChecking}
          label="Buscar nuevos horarios"
          onPress={() => void checkAvailability()}
        />

        <BookingScheduleStep
          availabilityError={availabilityError}
          barberChoice={barberChoice}
          barbers={data.catalog.barbers}
          dates={bookingDates}
          description="Selecciona una fecha y un turno disponibles para esta reserva."
          hasCheckedAvailability={hasCheckedAvailability}
          isCheckingSlots={isChecking}
          minBookingNoticeMinutes={data.catalog.rules.minBookingNoticeMinutes}
          onChangeDate={changeDate}
          onRetry={() => void checkAvailability()}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            setAvailabilityError(null);
          }}
          selectedDate={date}
          selectedSlot={selectedSlot}
          slots={slots}
          title="Elige el nuevo horario"
        />

        {review ? <RescheduleComparison review={review} /> : null}

        <View style={styles.actions}>
          <ActionButton
            disabled={!selectedSlot}
            isLoading={isSubmitting}
            label="Confirmar reprogramación"
            onPress={() => void submit()}
          />
          <ActionButton
            disabled={isSubmitting}
            label="Volver sin cambios"
            onPress={() => router.replace(getClientReservationHref(data.reservation.id) as Href)}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function CurrentAppointment({ reservation }: { reservation: ClientReservation }) {
  return (
    <SurfaceCard style={styles.currentCard}>
      <ThemedText style={styles.cardLabel} themeColor="textSecondary">
        Cita actual
      </ThemedText>
      <ThemedText style={styles.cardDate}>{formatLimaDate(reservation.startsAt)}</ThemedText>
      <ThemedText style={styles.cardTime} themeColor="primary">
        {formatLimaTime(reservation.startsAt)} a {formatLimaTime(reservation.endsAt)}
      </ThemedText>
      <ThemedText style={styles.cardBarber} themeColor="textSecondary">
        Con {reservation.barberName}
      </ThemedText>
    </SurfaceCard>
  );
}

function RescheduleComparison({ review }: { review: ReturnType<typeof buildRescheduleReview> }) {
  return (
    <View style={styles.comparisonSection}>
      <View style={styles.comparisonHeading}>
        <ThemedText style={styles.comparisonTitle}>Revisa el cambio</ThemedText>
        <ThemedText style={styles.comparisonDescription} themeColor="textSecondary">
          Confirma que el nuevo turno sea el correcto antes de continuar.
        </ThemedText>
      </View>
      <View style={styles.comparisonGrid}>
        <ComparisonCard
          label="Actual"
          startsAt={review.current.startsAt}
          barberName={review.current.barberName}
        />
        <ComparisonCard
          label="Nuevo"
          startsAt={review.next.startsAt}
          barberName={review.next.barberName}
          emphasized
        />
      </View>
      <ThemedText style={styles.comparisonServices} themeColor="textSecondary">
        Se conservan: {getReservationServiceSummary(review.services, 10)}.
      </ThemedText>
    </View>
  );
}

function ComparisonCard({
  label,
  startsAt,
  barberName,
  emphasized = false,
}: {
  label: string;
  startsAt: string;
  barberName: string;
  emphasized?: boolean;
}) {
  const theme = useTheme();
  return (
    <SurfaceCard
      style={[
        styles.comparisonCard,
        emphasized ? { backgroundColor: theme.surfaceMuted, borderColor: theme.primary } : null,
      ]}
    >
      <ThemedText style={styles.cardLabel} themeColor={emphasized ? 'primary' : 'textSecondary'}>
        {label}
      </ThemedText>
      <ThemedText style={styles.comparisonDate}>{formatLimaDate(startsAt)}</ThemedText>
      <ThemedText style={styles.comparisonTime}>{formatLimaTime(startsAt)}</ThemedText>
      <ThemedText style={styles.comparisonBarber} themeColor="textSecondary">
        {barberName}
      </ThemedText>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  frozenCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  lockIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  frozenCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  frozenTitle: { fontSize: TypeScale.body, fontWeight: '800' },
  frozenDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  currentCard: { gap: Spacing.one, padding: Spacing.four },
  cardLabel: { fontSize: TypeScale.caption, fontWeight: '800' },
  cardDate: { marginTop: Spacing.one, fontSize: TypeScale.title, fontWeight: '800' },
  cardTime: {
    fontSize: TypeScale.headline,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 38,
  },
  cardBarber: { marginTop: Spacing.one, fontSize: TypeScale.label },
  comparisonSection: { gap: Spacing.three },
  comparisonHeading: { gap: Spacing.one },
  comparisonTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  comparisonDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  comparisonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  comparisonCard: { minWidth: 220, flex: 1, gap: Spacing.one, padding: Spacing.three },
  comparisonDate: { marginTop: Spacing.one, fontSize: TypeScale.body, fontWeight: '800' },
  comparisonTime: { fontSize: TypeScale.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
  comparisonBarber: { marginTop: Spacing.one, fontSize: TypeScale.label },
  comparisonServices: { fontSize: TypeScale.label, lineHeight: 21 },
  actions: { gap: Spacing.three },
});

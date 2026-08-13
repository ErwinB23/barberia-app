import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  BarberAndDateSection,
  formatLimaDate,
  formatLimaTime,
  getBookingCatalog,
  getBookingErrorMessage,
  getTodayInLima,
  isValidDateInput,
  SlotSection,
  useFocusedResource,
  type AvailableSlot,
} from '@/features/booking';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { getRescheduleAvailableSlots, rescheduleReservation } from '../actions';
import { getReservationErrorMessage } from '../errors';
import { getClientReservation } from '../queries';
import { canRescheduleReservation } from '../reservation-domain';

export function RescheduleReservationScreen({ reservationId }: { reservationId: string | null }) {
  const { user } = useAuth();
  const [barberChoice, setBarberChoice] = useState<'any' | string>('any');
  const [date, setDate] = useState(getTodayInLima);
  const [dateError, setDateError] = useState<string | undefined>();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user || !reservationId) return null;
    const reservation = await getClientReservation(user.id, reservationId);
    if (!reservation) return null;
    const catalog = await getBookingCatalog(reservation.barbershopId);
    return { reservation, catalog };
  }, [reservationId, user]);
  const { data, isLoading, error } = useFocusedResource(load);

  const candidateBarberIds = data?.catalog?.barbers.map((barber) => barber.id) ?? [];

  const resetSlots = () => {
    setSlots([]);
    setSelectedSlot(null);
    setFormError(null);
  };

  const checkAvailability = async () => {
    if (!data) return;

    if (!isValidDateInput(date)) {
      setDateError('Ingresa una fecha válida con formato AAAA-MM-DD.');
      return;
    }
    if (date < getTodayInLima()) {
      setDateError('Elige una fecha de hoy en adelante.');
      return;
    }
    const barberIds = barberChoice === 'any' ? candidateBarberIds : [barberChoice];
    if (barberIds.length === 0 || !barberIds.every((id) => candidateBarberIds.includes(id))) {
      setFormError('No hay un barbero activo disponible para consultar.');
      return;
    }

    setIsChecking(true);
    setDateError(undefined);
    setFormError(null);
    setSelectedSlot(null);
    try {
      const results = await Promise.allSettled(
        barberIds.map((barberId) =>
          getRescheduleAvailableSlots(data.reservation.id, barberId, date),
        ),
      );
      const availableSlots = results
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
      const firstFailure = results.find((result) => result.status === 'rejected');

      if (availableSlots.length === 0 && firstFailure?.status === 'rejected') {
        throw firstFailure.reason;
      }

      setSlots(availableSlots);
    } catch (availabilityError) {
      setSlots([]);
      setFormError(getBookingErrorMessage(availabilityError));
    } finally {
      setIsChecking(false);
    }
  };

  const submit = async () => {
    if (!data || !selectedSlot) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await rescheduleReservation({
        reservationId: data.reservation.id,
        barberId: selectedSlot.barberId,
        startsAt: selectedSlot.startsAt,
      });
      router.replace(`/reservations/${data.reservation.id}` as Href);
    } catch (mutationError) {
      setFormError(getReservationErrorMessage(mutationError));
      setSelectedSlot(null);
      setSlots([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Preparando la reprogramación…</ThemedText>
      </ThemedView>
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
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={
            error ??
            'Esta reserva no puede reprogramarse: debe estar confirmada, ser futura y no haber usado su única reprogramación.'
          }
        />
        <ActionButton
          label="Volver a la reserva"
          onPress={() =>
            reservationId ? router.replace(`/reservations/${reservationId}` as Href) : router.back()
          }
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeading
          description="Conservaremos exactamente los servicios y snapshots de tu reserva original."
          eyebrow="Una reprogramación permitida"
          title="Elegir nuevo turno"
        />
        {error || formError ? <StatusMessage message={formError ?? error!} /> : null}
        <SurfaceCard style={styles.summary}>
          <ThemedText style={styles.summaryTitle}>Cita actual</ThemedText>
          <ThemedText>
            {formatLimaDate(data.reservation.startsAt)} ·{' '}
            {formatLimaTime(data.reservation.startsAt)}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {data.reservation.items.map((item) => item.serviceName).join(', ')}
          </ThemedText>
        </SurfaceCard>
        <BarberAndDateSection
          barberChoice={barberChoice}
          barbers={data.catalog.barbers}
          date={date}
          dateError={dateError}
          eligibleBarberIds={candidateBarberIds}
          onChangeDate={(value) => {
            setDate(value);
            setDateError(undefined);
            resetSlots();
          }}
          onSelectBarber={(value) => {
            setBarberChoice(value);
            resetSlots();
          }}
        />
        <ActionButton
          disabled={candidateBarberIds.length === 0}
          isLoading={isChecking}
          label="Consultar nuevos turnos"
          onPress={() => void checkAvailability()}
        />
        <SlotSection
          barbers={data.catalog.barbers}
          onSelectSlot={setSelectedSlot}
          selectedSlot={selectedSlot}
          slots={slots}
        />
        <ActionButton
          disabled={!selectedSlot}
          isLoading={isSubmitting}
          label="Confirmar reprogramación"
          onPress={() => void submit()}
        />
      </ScrollView>
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
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  summary: { gap: Spacing.two, padding: Spacing.four },
  summaryTitle: { fontSize: TypeScale.title, fontWeight: '700' },
});

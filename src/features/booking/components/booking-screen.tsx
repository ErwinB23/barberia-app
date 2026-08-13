import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { createReservation, getAvailableSlots } from '../actions';
import {
  buildReservationItems,
  calculateBookingPreview,
  formatLimaDate,
  formatLimaTime,
  formatPen,
  getEligibleBarberIds,
  getTodayInLima,
  isValidDateInput,
  reconcileStyleSelections,
  toggleServiceSelection,
} from '../booking-domain';
import { getBookingErrorMessage } from '../errors';
import { useFocusedResource } from '../hooks/use-focused-resource';
import { getBookingCatalog } from '../queries';
import type { AvailableSlot, PaymentMethod } from '../types';
import {
  BarberAndDateSection,
  PaymentSection,
  ServiceSection,
  SlotSection,
} from './booking-selection-sections';

export function BookingScreen({ barbershopId }: { barbershopId: string | null }) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<Record<string, string>>({});
  const [barberChoice, setBarberChoice] = useState<'any' | string>('any');
  const [date, setDate] = useState(getTodayInLima);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | undefined>();
  const load = useCallback(
    () => (barbershopId ? getBookingCatalog(barbershopId) : Promise.resolve(null)),
    [barbershopId],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);

  const eligibleBarberIds = useMemo(
    () =>
      data
        ? getEligibleBarberIds(
            selectedServiceIds,
            data.barbers.map((barber) => barber.id),
            data.assignments,
          )
        : [],
    [data, selectedServiceIds],
  );
  const preview = useMemo(
    () => calculateBookingPreview(selectedServiceIds, data?.services ?? []),
    [data?.services, selectedServiceIds],
  );

  const resetAvailability = () => {
    setSlots([]);
    setSelectedSlot(null);
    setFormError(null);
  };

  const toggleService = (serviceId: string) => {
    if (!selectedServiceIds.includes(serviceId) && selectedServiceIds.length >= 10) {
      setFormError('Puedes combinar como máximo 10 servicios en una reserva.');
      return;
    }
    const nextServiceIds = toggleServiceSelection(selectedServiceIds, serviceId);
    setSelectedServiceIds(nextServiceIds);
    setSelectedStyles((current) => reconcileStyleSelections(current, nextServiceIds));
    setBarberChoice('any');
    resetAvailability();
  };

  const selectStyle = (serviceId: string, styleId: string | null) => {
    setSelectedStyles((current) => {
      const entries = Object.entries(current).filter(([key]) => key !== serviceId);
      return Object.fromEntries(styleId ? [...entries, [serviceId, styleId]] : entries);
    });
    resetAvailability();
  };

  const checkAvailability = async () => {
    if (selectedServiceIds.length === 0) {
      setFormError('Selecciona al menos un servicio.');
      return;
    }
    if (!isValidDateInput(date)) {
      setDateError('Ingresa una fecha válida con formato AAAA-MM-DD.');
      return;
    }
    if (date < getTodayInLima()) {
      setDateError('Elige una fecha de hoy en adelante.');
      return;
    }
    const barberIds = barberChoice === 'any' ? eligibleBarberIds : [barberChoice];
    if (barberIds.length === 0 || !barberIds.every((id) => eligibleBarberIds.includes(id))) {
      setFormError('Elige un barbero que pueda realizar todos los servicios.');
      return;
    }

    setIsCheckingSlots(true);
    setDateError(undefined);
    setFormError(null);
    setSelectedSlot(null);
    try {
      const results = await Promise.all(
        barberIds.map((barberId) => getAvailableSlots(barberId, date, selectedServiceIds)),
      );
      setSlots(results.flat().sort((left, right) => left.startsAt.localeCompare(right.startsAt)));
    } catch (availabilityError) {
      setSlots([]);
      setFormError(getBookingErrorMessage(availabilityError));
    } finally {
      setIsCheckingSlots(false);
    }
  };

  const submit = async () => {
    if (!data || !selectedSlot) {
      setFormError('Selecciona un turno disponible antes de confirmar.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const reservationId = await createReservation({
        barberId: selectedSlot.barberId,
        items: buildReservationItems(selectedServiceIds, selectedStyles, data.styles),
        paymentMethod,
        startsAt: selectedSlot.startsAt,
      });
      router.replace(`/reservations/${reservationId}?created=1` as Href);
    } catch (submissionError) {
      setFormError(getBookingErrorMessage(submissionError));
      setSelectedSlot(null);
      setSlots([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Preparando tu reserva…</ThemedText>
      </ThemedView>
    );
  }

  if (!barbershopId || !data || data.barbershop.status !== 'published') {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={error ?? 'Esta barbería no está aceptando nuevas reservas en este momento.'}
        />
        <ActionButton
          label="Volver a explorar"
          onPress={() => router.replace('/explore' as Href)}
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
          description="Arma tu cita y confirma un turno disponible."
          eyebrow="Nueva reserva"
          title={data.barbershop.name}
        />
        {error || formError ? <StatusMessage message={formError ?? error!} /> : null}
        <ServiceSection
          onSelectStyle={selectStyle}
          onToggleService={toggleService}
          selectedServiceIds={selectedServiceIds}
          selectedStyles={selectedStyles}
          services={data.services}
          styles={data.styles}
        />
        <BarberAndDateSection
          barberChoice={barberChoice}
          barbers={data.barbers}
          date={date}
          dateError={dateError}
          eligibleBarberIds={eligibleBarberIds}
          onChangeDate={(value) => {
            setDate(value);
            setDateError(undefined);
            resetAvailability();
          }}
          onSelectBarber={(value) => {
            setBarberChoice(value);
            resetAvailability();
          }}
        />
        <ActionButton
          disabled={selectedServiceIds.length === 0 || eligibleBarberIds.length === 0}
          isLoading={isCheckingSlots}
          label="Consultar disponibilidad"
          onPress={() => void checkAvailability()}
        />
        {slots.length === 0 && !isCheckingSlots ? (
          <ThemedText style={styles.slotHint} themeColor="textSecondary">
            {selectedServiceIds.length > 0
              ? 'Si no aparecen turnos después de consultar, prueba otra fecha o profesional.'
              : 'Selecciona tus servicios para comenzar.'}
          </ThemedText>
        ) : null}
        <SlotSection
          barbers={data.barbers}
          onSelectSlot={setSelectedSlot}
          selectedSlot={selectedSlot}
          slots={slots}
        />
        <PaymentSection
          onSelect={setPaymentMethod}
          paymentMethod={paymentMethod}
          yapeSettings={data.yapeSettings}
        />
        <SurfaceCard style={styles.summary}>
          <ThemedText style={styles.summaryTitle}>Resumen previo</ThemedText>
          <SummaryLine label="Servicios" value={String(selectedServiceIds.length)} />
          <SummaryLine label="Precio estimado" value={formatPen(preview.totalPrice)} />
          <SummaryLine label="Duración estimada" value={`${preview.totalDurationMinutes} min`} />
          {selectedSlot ? (
            <SummaryLine
              label="Turno"
              value={`${formatLimaDate(selectedSlot.startsAt)}, ${formatLimaTime(selectedSlot.startsAt)}`}
            />
          ) : null}
          <ThemedText style={styles.snapshotNote} themeColor="textSecondary">
            El precio y la duración definitivos se congelan de forma segura al crear la reserva.
          </ThemedText>
          <ActionButton
            disabled={!selectedSlot || selectedServiceIds.length === 0}
            isLoading={isSubmitting}
            label="Confirmar reserva"
            onPress={() => void submit()}
          />
        </SurfaceCard>
        <ActionButton
          label="Actualizar catálogo"
          onPress={() => void reload()}
          variant="secondary"
        />
      </ScrollView>
    </ThemedView>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLine}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText style={styles.summaryValue}>{value}</ThemedText>
    </View>
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
  slotHint: { textAlign: 'center', fontSize: TypeScale.label, lineHeight: 21 },
  summary: { gap: Spacing.three, padding: Spacing.four },
  summaryTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  summaryValue: { flexShrink: 1, textAlign: 'right', fontWeight: '700' },
  snapshotNote: { fontSize: TypeScale.caption, lineHeight: 19 },
});

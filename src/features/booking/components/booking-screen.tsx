import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, Motion, TypeScale } from '@/theme/tokens';

import { createReservation, getAvailableSlots } from '../actions';
import {
  buildReservationItems,
  calculateBookingPreview,
  canContinueBookingStep,
  canStartBookingSubmission,
  getBookingDateRange,
  getCreatedReservationHref,
  getEligibleBarberIds,
  getNextBookingStep,
  getPreviousBookingStep,
  getTodayInLima,
  isValidDateInput,
  reconcileStyleSelections,
  toggleServiceSelection,
  type BookingFlowStep,
} from '../booking-domain';
import { getBookingErrorMessage } from '../errors';
import { useFocusedResource } from '../hooks/use-focused-resource';
import { getBookingCatalog } from '../queries';
import type { AvailableSlot, PaymentMethod } from '../types';
import { BookingActionBar } from './booking-action-bar';
import { BookingBarberStep } from './booking-barber-step';
import { BookingConfirmationStep } from './booking-confirmation-step';
import { BookingProgress } from './booking-progress';
import { BookingScheduleStep } from './booking-schedule-step';
import { BookingServiceStep } from './booking-service-step';

export function BookingScreen({ barbershopId }: { barbershopId: string | null }) {
  const scrollRef = useRef<ScrollView>(null);
  const availabilityRequestId = useRef(0);
  const isSubmittingRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<BookingFlowStep>('services');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<Record<string, string>>({});
  const [barberChoice, setBarberChoice] = useState<'any' | string>('any');
  const [date, setDate] = useState(getTodayInLima);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
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
  const bookingDates = useMemo(
    () => (data ? getBookingDateRange(getTodayInLima(), data.rules.maxBookingDays) : []),
    [data],
  );

  const selectionState = {
    selectedServiceCount: selectedServiceIds.length,
    eligibleBarberCount: eligibleBarberIds.length,
    hasSelectedSlot: selectedSlot !== null,
  };

  const goToStep = (step: BookingFlowStep) => {
    setCurrentStep(step);
    setFlowError(null);
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
  };

  const resetAvailability = () => {
    availabilityRequestId.current += 1;
    setIsCheckingSlots(false);
    setSlots([]);
    setSelectedSlot(null);
    setHasCheckedAvailability(false);
    setAvailabilityError(null);
    setSubmissionError(null);
  };

  const toggleService = (serviceId: string) => {
    if (!selectedServiceIds.includes(serviceId) && selectedServiceIds.length >= 10) {
      setFlowError('Puedes combinar como máximo 10 servicios en una reserva.');
      return;
    }

    const nextServiceIds = toggleServiceSelection(selectedServiceIds, serviceId);
    setSelectedServiceIds(nextServiceIds);
    setSelectedStyles((current) => reconcileStyleSelections(current, nextServiceIds));
    setBarberChoice('any');
    setFlowError(null);
    resetAvailability();
  };

  const selectStyle = (serviceId: string, styleId: string | null) => {
    setSelectedStyles((current) => {
      const entries = Object.entries(current).filter(([key]) => key !== serviceId);
      return Object.fromEntries(styleId ? [...entries, [serviceId, styleId]] : entries);
    });
    resetAvailability();
  };

  const checkAvailability = async (targetDate = date) => {
    if (selectedServiceIds.length === 0) {
      setFlowError('Selecciona al menos un servicio.');
      return;
    }
    if (!isValidDateInput(targetDate) || !bookingDates.includes(targetDate)) {
      setAvailabilityError('Elige una fecha dentro del rango permitido por la barbería.');
      return;
    }

    const barberIds = barberChoice === 'any' ? eligibleBarberIds : [barberChoice];
    if (barberIds.length === 0 || !barberIds.every((id) => eligibleBarberIds.includes(id))) {
      setFlowError('Elige un profesional que pueda realizar todos los servicios.');
      return;
    }

    const requestId = ++availabilityRequestId.current;
    setIsCheckingSlots(true);
    setHasCheckedAvailability(false);
    setAvailabilityError(null);
    setSubmissionError(null);
    setSelectedSlot(null);
    try {
      const results = await Promise.all(
        barberIds.map((barberId) => getAvailableSlots(barberId, targetDate, selectedServiceIds)),
      );
      if (requestId !== availabilityRequestId.current) return;
      setSlots(results.flat().sort((left, right) => left.startsAt.localeCompare(right.startsAt)));
      setHasCheckedAvailability(true);
    } catch (availabilityFailure) {
      if (requestId !== availabilityRequestId.current) return;
      setSlots([]);
      setHasCheckedAvailability(true);
      setAvailabilityError(getBookingErrorMessage(availabilityFailure));
    } finally {
      if (requestId === availabilityRequestId.current) setIsCheckingSlots(false);
    }
  };

  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    resetAvailability();
    void checkAvailability(nextDate);
  };

  const continueFlow = () => {
    if (!canContinueBookingStep(currentStep, selectionState)) {
      setFlowError(getIncompleteStepMessage(currentStep));
      return;
    }

    if (currentStep === 'professional') {
      goToStep('schedule');
      void checkAvailability(date);
      return;
    }
    if (currentStep === 'confirm') {
      void submit();
      return;
    }
    goToStep(getNextBookingStep(currentStep));
  };

  const goBack = () => {
    if (currentStep === 'services') {
      const destination = barbershopId
        ? `/explore/${encodeURIComponent(barbershopId)}`
        : '/explore';
      router.replace(destination as Href);
      return;
    }
    goToStep(getPreviousBookingStep(currentStep));
  };

  const submit = async () => {
    const canSubmit = canStartBookingSubmission({
      isSubmitting: isSubmittingRef.current,
      selectedServiceCount: selectedServiceIds.length,
      hasSelectedSlot: selectedSlot !== null,
    });
    if (!data || !selectedSlot || !canSubmit) {
      if (!isSubmittingRef.current) {
        setSubmissionError('Selecciona un turno disponible antes de confirmar.');
      }
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const reservationId = await createReservation({
        barberId: selectedSlot.barberId,
        items: buildReservationItems(selectedServiceIds, selectedStyles, data.styles),
        paymentMethod,
        startsAt: selectedSlot.startsAt,
      });
      router.replace(getCreatedReservationHref(reservationId) as Href);
    } catch (submissionFailure) {
      setSubmissionError(getBookingErrorMessage(submissionFailure));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) return <BookingLoadingState />;

  if (!barbershopId || !data || data.barbershop.status !== 'published') {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage
          message={error ?? 'Esta barbería no está aceptando nuevas reservas en este momento.'}
        />
        {error ? <ActionButton label="Volver a intentar" onPress={() => void reload()} /> : null}
        <ActionButton
          label="Volver a explorar"
          onPress={() => router.replace('/explore' as Href)}
          variant="secondary"
        />
      </ThemedView>
    );
  }

  const actionLabel = getStepActionLabel(currentStep);
  const isStepLoading = currentStep === 'schedule' ? isCheckingSlots : isSubmitting;
  const isPrimaryDisabled =
    !canContinueBookingStep(currentStep, selectionState) ||
    (currentStep === 'schedule' && isCheckingSlots);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
      >
        <View style={styles.topbar}>
          <View style={styles.shopCopy}>
            <ThemedText style={styles.context} themeColor="textSecondary">
              Nueva reserva
            </ThemedText>
            <ThemedText numberOfLines={1} style={styles.shopName}>
              {data.barbershop.name}
            </ThemedText>
          </View>
        </View>
        <BookingProgress currentStep={currentStep} />
        {error || flowError ? <StatusMessage message={flowError ?? error!} /> : null}

        <Animated.View
          entering={FadeIn.duration(Motion.state).reduceMotion(ReduceMotion.System)}
          key={currentStep}
          style={styles.stepContent}
        >
          {currentStep === 'services' ? (
            <BookingServiceStep
              onSelectStyle={selectStyle}
              onToggleService={toggleService}
              selectedServiceIds={selectedServiceIds}
              selectedStyles={selectedStyles}
              services={data.services}
              styles={data.styles}
            />
          ) : null}
          {currentStep === 'professional' ? (
            <BookingBarberStep
              barberChoice={barberChoice}
              barbers={data.barbers}
              eligibleBarberIds={eligibleBarberIds}
              onSelectBarber={(value) => {
                setBarberChoice(value);
                resetAvailability();
              }}
            />
          ) : null}
          {currentStep === 'schedule' ? (
            <BookingScheduleStep
              availabilityError={availabilityError}
              barberChoice={barberChoice}
              barbers={data.barbers}
              dates={bookingDates}
              hasCheckedAvailability={hasCheckedAvailability}
              isCheckingSlots={isCheckingSlots}
              minBookingNoticeMinutes={data.rules.minBookingNoticeMinutes}
              onChangeDate={changeDate}
              onRetry={() => void checkAvailability()}
              onSelectSlot={(slot) => {
                setSelectedSlot(slot);
                setAvailabilityError(null);
              }}
              selectedDate={date}
              selectedSlot={selectedSlot}
              slots={slots}
            />
          ) : null}
          {currentStep === 'confirm' && selectedSlot ? (
            <BookingConfirmationStep
              barbers={data.barbers}
              barbershop={data.barbershop}
              onSelectPayment={setPaymentMethod}
              paymentMethod={paymentMethod}
              selectedServiceIds={selectedServiceIds}
              selectedSlot={selectedSlot}
              selectedStyles={selectedStyles}
              services={data.services}
              styles={data.styles}
              submissionError={submissionError}
              totalDurationMinutes={preview.totalDurationMinutes}
              totalPrice={preview.totalPrice}
              yapeSettings={data.yapeSettings}
            />
          ) : null}
        </Animated.View>
      </ScrollView>

      <BookingActionBar
        isLoading={isStepLoading}
        onBack={goBack}
        onContinue={continueFlow}
        primaryDisabled={isPrimaryDisabled}
        primaryLabel={actionLabel}
        selectedServiceCount={selectedServiceIds.length}
        showBack
        totalDurationMinutes={preview.totalDurationMinutes}
        totalPrice={preview.totalPrice}
      />
    </ThemedView>
  );
}

function BookingLoadingState() {
  return (
    <ThemedView style={styles.loadingScreen}>
      <View style={styles.loadingContent}>
        <ActivityIndicator />
        <ThemedText style={styles.loadingTitle}>Preparando tu reserva</ThemedText>
        <ThemedText style={styles.loadingCopy} themeColor="textSecondary">
          Estamos cargando servicios, profesionales y reglas de disponibilidad.
        </ThemedText>
        <SurfaceCard style={styles.loadingCard} />
        <SurfaceCard style={styles.loadingCard} />
      </View>
    </ThemedView>
  );
}

function getStepActionLabel(step: BookingFlowStep) {
  if (step === 'professional') return 'Ver horarios';
  if (step === 'schedule') return 'Revisar reserva';
  if (step === 'confirm') return 'Confirmar reserva';
  return 'Continuar';
}

function getIncompleteStepMessage(step: BookingFlowStep) {
  if (step === 'services') return 'Selecciona al menos un servicio para continuar.';
  if (step === 'professional') {
    return 'No hay un profesional compatible con todos los servicios elegidos.';
  }
  if (step === 'schedule') return 'Selecciona un horario disponible para continuar.';
  return 'Revisa la reserva antes de confirmar.';
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  stepContent: { width: '100%' },
  shopCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  context: { fontSize: TypeScale.caption, fontWeight: '700' },
  shopName: { fontSize: TypeScale.title, fontWeight: '800' },
  loadingScreen: { flex: 1 },
  loadingContent: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingTop: Spacing.six,
  },
  loadingTitle: { fontSize: TypeScale.title, fontWeight: '800', textAlign: 'center' },
  loadingCopy: { maxWidth: 420, fontSize: TypeScale.label, lineHeight: 21, textAlign: 'center' },
  loadingCard: { width: '100%', height: 124 },
});

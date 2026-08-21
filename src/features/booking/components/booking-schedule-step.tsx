import { useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { IconButton } from '@/shared/components/ui/icon-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { formatLimaTime, groupAvailableSlotsByPeriod } from '../booking-domain';
import type { AvailableSlot, BookingBarber } from '../types';
import { BookingSelectionIndicator } from './booking-selection-indicator';
import { BookingStepHeading } from './booking-step-heading';

export function BookingScheduleStep({
  dates,
  selectedDate,
  slots,
  barbers,
  barberChoice,
  selectedSlot,
  minBookingNoticeMinutes,
  isCheckingSlots,
  hasCheckedAvailability,
  availabilityError,
  onChangeDate,
  onSelectSlot,
  onRetry,
  title = 'Encuentra tu mejor horario',
  description = 'Elige un día y uno de los turnos que la barbería tiene disponible en tiempo real.',
}: {
  dates: string[];
  selectedDate: string;
  slots: AvailableSlot[];
  barbers: BookingBarber[];
  barberChoice: 'any' | string;
  selectedSlot: AvailableSlot | null;
  minBookingNoticeMinutes: number;
  isCheckingSlots: boolean;
  hasCheckedAvailability: boolean;
  availabilityError: string | null;
  onChangeDate: (date: string) => void;
  onSelectSlot: (slot: AvailableSlot) => void;
  onRetry: () => void;
  title?: string;
  description?: string;
}) {
  const groupedSlots = groupAvailableSlotsByPeriod(slots);
  const showBarberOnSlot = barberChoice === 'any';

  return (
    <View style={styles.step}>
      <BookingStepHeading description={description} title={title} />
      <DateStrip dates={dates} onChangeDate={onChangeDate} selectedDate={selectedDate} />
      <ThemedText style={styles.notice} themeColor="textSecondary">
        {formatBookingNotice(minBookingNoticeMinutes)}. Los horarios se validan nuevamente al
        confirmar.
      </ThemedText>

      {availabilityError ? <StatusMessage message={availabilityError} /> : null}
      {isCheckingSlots ? (
        <View accessibilityLiveRegion="polite" style={styles.loadingState}>
          <ActivityIndicator />
          <ThemedText style={styles.loadingTitle}>Buscando horarios disponibles</ThemedText>
          <ThemedText style={styles.loadingCopy} themeColor="textSecondary">
            Estamos consultando la disponibilidad real para el día elegido.
          </ThemedText>
        </View>
      ) : null}

      {!isCheckingSlots && hasCheckedAvailability && slots.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No hay horarios para este día</ThemedText>
          <ThemedText style={styles.emptyCopy} themeColor="textSecondary">
            Prueba otra fecha o vuelve a Profesional para elegir una opción diferente.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.retry, pressed ? styles.pressed : null]}
          >
            <ThemedText style={styles.retryLabel} themeColor="primary">
              Volver a consultar
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {!isCheckingSlots && slots.length > 0 ? (
        <View style={styles.slotGroups}>
          {groupedSlots.map((group) => (
            <View key={group.key} style={styles.slotGroup}>
              <ThemedText style={styles.groupTitle}>{group.label}</ThemedText>
              <View style={styles.slotGrid}>
                {group.slots.map((slot) => {
                  const barber = barbers.find((candidate) => candidate.id === slot.barberId);
                  const isSelected =
                    selectedSlot?.barberId === slot.barberId &&
                    selectedSlot.startsAt === slot.startsAt;
                  return (
                    <SlotOption
                      barberName={barber?.displayName ?? 'Profesional disponible'}
                      isSelected={isSelected}
                      key={`${slot.barberId}-${slot.startsAt}`}
                      onPress={() => onSelectSlot(slot)}
                      showBarber={showBarberOnSlot}
                      slot={slot}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function DateStrip({
  dates,
  selectedDate,
  onChangeDate,
}: {
  dates: string[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
}) {
  const listRef = useRef<FlatList<string>>(null);
  const selectedIndex = Math.max(0, dates.indexOf(selectedDate));

  const selectIndex = (index: number) => {
    const nextDate = dates[index];
    if (!nextDate) return;
    onChangeDate(nextDate);
    listRef.current?.scrollToIndex({ animated: true, index, viewPosition: 0.5 });
  };

  return (
    <View style={styles.dateSection}>
      <View style={styles.dateToolbar}>
        <View style={styles.dateCopy}>
          <ThemedText style={styles.dateTitle}>Fecha</ThemedText>
          <ThemedText style={styles.dateRange} themeColor="textSecondary">
            {dates.length} días disponibles para consultar
          </ThemedText>
        </View>
        <View style={styles.dateActions}>
          {selectedIndex > 0 ? (
            <IconButton
              accessibilityLabel="Día anterior"
              icon={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              onPress={() => selectIndex(selectedIndex - 1)}
            />
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
          {selectedIndex < dates.length - 1 ? (
            <IconButton
              accessibilityLabel="Día siguiente"
              icon={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              onPress={() => selectIndex(selectedIndex + 1)}
            />
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>
      </View>
      <FlatList
        contentContainerStyle={styles.dateList}
        data={dates}
        horizontal
        initialNumToRender={8}
        keyExtractor={(date) => date}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({ animated: true, offset: index * 90 });
        }}
        ref={listRef}
        renderItem={({ item, index }) => (
          <DateOption
            date={item}
            isFirst={index === 0}
            isSelected={item === selectedDate}
            onPress={() => selectIndex(index)}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function DateOption({
  date,
  isFirst,
  isSelected,
  onPress,
}: {
  date: string;
  isFirst: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const dateValue = new Date(`${date}T12:00:00.000Z`);
  const weekday = new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    timeZone: 'UTC',
  })
    .format(dateValue)
    .replace('.', '')
    .toLocaleUpperCase('es-PE');
  const day = new Intl.DateTimeFormat('es-PE', { day: '2-digit', timeZone: 'UTC' }).format(
    dateValue,
  );
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' })
    .format(dateValue)
    .replace('.', '');
  const fullDate = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateValue);

  return (
    <Pressable
      accessibilityLabel={`${isFirst ? 'Hoy, ' : ''}${fullDate}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dateOption,
        {
          backgroundColor: isSelected ? theme.primary : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        pressed ? { opacity: 0.82 } : null,
      ]}
    >
      <View style={styles.dateTopline}>
        <ThemedText
          style={[styles.weekday, isSelected ? { color: theme.onPrimary } : null]}
          themeColor="textSecondary"
        >
          {isFirst ? 'HOY' : weekday}
        </ThemedText>
        {isSelected ? (
          <AppIcon
            color={theme.onPrimary}
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={13}
          />
        ) : null}
      </View>
      <ThemedText style={[styles.day, isSelected ? { color: theme.onPrimary } : null]}>
        {day}
      </ThemedText>
      <ThemedText
        style={[styles.month, isSelected ? { color: theme.onPrimary } : null]}
        themeColor="textSecondary"
      >
        {month}
      </ThemedText>
    </Pressable>
  );
}

function SlotOption({
  slot,
  barberName,
  showBarber,
  isSelected,
  onPress,
}: {
  slot: AvailableSlot;
  barberName: string;
  showBarber: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const timeLabel = `${formatLimaTime(slot.startsAt)} a ${formatLimaTime(slot.endsAt)}`;

  return (
    <Pressable
      accessibilityLabel={`${timeLabel}, ${barberName}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.slot,
        {
          backgroundColor: isSelected ? theme.surfaceMuted : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      <View style={styles.slotCopy}>
        <ThemedText style={styles.slotTime}>{formatLimaTime(slot.startsAt)}</ThemedText>
        {showBarber ? (
          <ThemedText numberOfLines={1} style={styles.slotBarber} themeColor="textSecondary">
            {barberName}
          </ThemedText>
        ) : null}
      </View>
      <BookingSelectionIndicator selected={isSelected} />
    </Pressable>
  );
}

function formatBookingNotice(minutes: number) {
  if (minutes === 0) return 'Puedes reservar desde el siguiente turno disponible';
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `Reserva con al menos ${hours} ${hours === 1 ? 'hora' : 'horas'} de anticipación`;
  }
  return `Reserva con al menos ${minutes} minutos de anticipación`;
}

const styles = StyleSheet.create({
  step: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  dateSection: { gap: Spacing.three },
  dateToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  dateCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  dateTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  dateRange: { fontSize: TypeScale.caption },
  dateActions: { flexDirection: 'row', gap: Spacing.one },
  iconPlaceholder: { width: 48, height: 48 },
  dateList: { gap: Spacing.two, paddingRight: Spacing.four },
  dateOption: {
    width: 82,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.two,
  },
  weekday: { fontSize: TypeScale.caption - 1, fontWeight: '800', letterSpacing: 0.6 },
  dateTopline: {
    minHeight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  day: { fontSize: TypeScale.title, fontWeight: '800', fontVariant: ['tabular-nums'] },
  month: { fontSize: TypeScale.caption, fontWeight: '600' },
  notice: { fontSize: TypeScale.caption, lineHeight: 19 },
  loadingState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  loadingTitle: { fontSize: TypeScale.body, fontWeight: '800', textAlign: 'center' },
  loadingCopy: { maxWidth: 360, fontSize: TypeScale.label, lineHeight: 21, textAlign: 'center' },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
  emptyTitle: { fontSize: TypeScale.title, fontWeight: '800', textAlign: 'center' },
  emptyCopy: { maxWidth: 420, fontSize: TypeScale.label, lineHeight: 21, textAlign: 'center' },
  retry: { minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.three },
  retryLabel: { fontSize: TypeScale.label, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  slotGroups: { gap: Spacing.four },
  slotGroup: { gap: Spacing.three },
  groupTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  slot: {
    minWidth: 146,
    minHeight: 64,
    flexGrow: 1,
    flexBasis: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  slotCopy: { minWidth: 0, flex: 1, gap: 2 },
  slotTime: { fontSize: TypeScale.body, fontWeight: '800', fontVariant: ['tabular-nums'] },
  slotBarber: { fontSize: TypeScale.caption },
});

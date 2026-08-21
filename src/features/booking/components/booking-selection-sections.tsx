import { StyleSheet, View } from 'react-native';

import { FormField } from '@/shared/components/ui/form-field';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { TypeScale } from '@/theme/tokens';

import { formatLimaTime } from '../booking-domain';
import type { AvailableSlot, BookingBarber } from '../types';
import { SelectionRow } from './selection-row';

export function BarberAndDateSection({
  barbers,
  eligibleBarberIds,
  barberChoice,
  date,
  dateError,
  onSelectBarber,
  onChangeDate,
}: {
  barbers: BookingBarber[];
  eligibleBarberIds: string[];
  barberChoice: 'any' | string;
  date: string;
  dateError?: string;
  onSelectBarber: (barberId: 'any' | string) => void;
  onChangeDate: (date: string) => void;
}) {
  const eligibleBarbers = barbers.filter((barber) => eligibleBarberIds.includes(barber.id));

  return (
    <SurfaceCard style={stylesSheet.sectionCard}>
      <SectionHeading
        title="2. Profesional y fecha"
        description="Puedes elegir a alguien o comparar todos los turnos disponibles."
      />
      <SelectionRow
        description="Te mostraremos las mejores combinaciones de horario y profesional."
        onPress={() => onSelectBarber('any')}
        selected={barberChoice === 'any'}
        title="Cualquier barbero disponible"
      />
      {eligibleBarbers.map((barber) => (
        <SelectionRow
          description={barber.bio ?? undefined}
          key={barber.id}
          onPress={() => onSelectBarber(barber.id)}
          selected={barberChoice === barber.id}
          title={barber.displayName}
        />
      ))}
      {eligibleBarbers.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          No hay un barbero activo asignado a todos los servicios elegidos.
        </ThemedText>
      ) : null}
      <FormField
        autoCapitalize="none"
        error={dateError}
        helperText="Formato: AAAA-MM-DD. La barbería define la anticipación permitida."
        label="Fecha"
        onChangeText={onChangeDate}
        placeholder="2026-08-20"
        required
        value={date}
      />
    </SurfaceCard>
  );
}

export function SlotSection({
  slots,
  barbers,
  selectedSlot,
  onSelectSlot,
}: {
  slots: AvailableSlot[];
  barbers: BookingBarber[];
  selectedSlot: AvailableSlot | null;
  onSelectSlot: (slot: AvailableSlot) => void;
}) {
  return (
    <SurfaceCard style={stylesSheet.sectionCard}>
      <SectionHeading
        title="3. Elige un turno"
        description="La disponibilidad se consulta en tiempo real y se valida otra vez al confirmar."
      />
      {slots.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          Consulta la disponibilidad para ver los turnos de esa fecha.
        </ThemedText>
      ) : (
        slots.map((slot) => {
          const barber = barbers.find((candidate) => candidate.id === slot.barberId);
          return (
            <SelectionRow
              description={`${formatLimaTime(slot.startsAt)} – ${formatLimaTime(slot.endsAt)}`}
              key={`${slot.barberId}-${slot.startsAt}`}
              onPress={() => onSelectSlot(slot)}
              selected={
                selectedSlot?.barberId === slot.barberId && selectedSlot.startsAt === slot.startsAt
              }
              title={barber?.displayName ?? 'Barbero disponible'}
            />
          );
        })
      )}
    </SurfaceCard>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <View style={stylesSheet.heading}>
      <ThemedText style={stylesSheet.sectionTitle}>{title}</ThemedText>
      <ThemedText style={stylesSheet.description} themeColor="textSecondary">
        {description}
      </ThemedText>
    </View>
  );
}

const stylesSheet = StyleSheet.create({
  sectionCard: { gap: Spacing.three, padding: Spacing.four },
  heading: { gap: Spacing.one },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  description: { fontSize: TypeScale.label, lineHeight: 21 },
});

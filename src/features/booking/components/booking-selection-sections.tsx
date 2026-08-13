import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { FormField } from '@/shared/components/ui/form-field';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { formatLimaTime, formatPen } from '../booking-domain';
import type {
  AvailableSlot,
  BookingBarber,
  BookingService,
  BookingStyle,
  PaymentMethod,
} from '../types';
import { SelectionRow } from './selection-row';

export function ServiceSection({
  services,
  selectedServiceIds,
  selectedStyles,
  styles,
  onToggleService,
  onSelectStyle,
}: {
  services: BookingService[];
  selectedServiceIds: string[];
  selectedStyles: Record<string, string>;
  styles: BookingStyle[];
  onToggleService: (serviceId: string) => void;
  onSelectStyle: (serviceId: string, styleId: string | null) => void;
}) {
  return (
    <SurfaceCard style={stylesSheet.sectionCard}>
      <SectionHeading
        title="1. Elige tus servicios"
        description="Puedes combinar varios servicios en una sola cita."
      />
      {services.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          Esta barbería no tiene servicios activos para reservar.
        </ThemedText>
      ) : null}
      {services.map((service) => {
        const isSelected = selectedServiceIds.includes(service.id);
        const serviceStyles = styles.filter((style) => style.serviceId === service.id);
        return (
          <View key={service.id} style={stylesSheet.optionGroup}>
            <SelectionRow
              description={`${formatPen(service.price)} · ${service.durationMinutes} min${service.description ? ` · ${service.description}` : ''}`}
              onPress={() => onToggleService(service.id)}
              selected={isSelected}
              title={service.name}
              type="checkbox"
            />
            {isSelected && serviceStyles.length > 0 ? (
              <View style={stylesSheet.nestedOptions}>
                <ThemedText style={stylesSheet.nestedTitle}>
                  Estilo de referencia (opcional)
                </ThemedText>
                <SelectionRow
                  onPress={() => onSelectStyle(service.id, null)}
                  selected={!selectedStyles[service.id]}
                  title="Sin estilo específico"
                />
                {serviceStyles.map((style) => (
                  <View key={style.id} style={stylesSheet.styleOption}>
                    {style.imageUrl?.startsWith('https://') ? (
                      <Image
                        accessibilityLabel={`Referencia visual de ${style.name}`}
                        contentFit="cover"
                        source={{ uri: style.imageUrl }}
                        style={stylesSheet.styleImage}
                      />
                    ) : null}
                    <SelectionRow
                      description={style.description ?? undefined}
                      onPress={() => onSelectStyle(service.id, style.id)}
                      selected={selectedStyles[service.id] === style.id}
                      title={style.name}
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </SurfaceCard>
  );
}

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

export function PaymentSection({
  paymentMethod,
  yapeSettings,
  onSelect,
}: {
  paymentMethod: PaymentMethod;
  yapeSettings: { holderName: string | null; phone: string | null; qrUrl: string | null } | null;
  onSelect: (method: PaymentMethod) => void;
}) {
  const showQr = yapeSettings?.qrUrl?.startsWith('https://');

  return (
    <SurfaceCard style={stylesSheet.sectionCard}>
      <SectionHeading
        title="4. Método de pago"
        description="La cita se confirma aunque el pago permanezca pendiente."
      />
      <SelectionRow
        description="Paga en la barbería. El efectivo lo confirma el personal autorizado."
        onPress={() => onSelect('cash')}
        selected={paymentMethod === 'cash'}
        title="Efectivo"
      />
      <SelectionRow
        description="La verificación de Yape la realiza un administrador."
        onPress={() => onSelect('yape')}
        selected={paymentMethod === 'yape'}
        title="Yape"
      />
      {paymentMethod === 'yape' ? (
        <View style={stylesSheet.yapeBox}>
          {showQr ? (
            <Image
              accessibilityLabel="Código QR de Yape de la barbería"
              contentFit="contain"
              source={{ uri: yapeSettings!.qrUrl! }}
              style={stylesSheet.qr}
            />
          ) : null}
          {yapeSettings?.holderName ? (
            <ThemedText>Titular: {yapeSettings.holderName}</ThemedText>
          ) : null}
          {yapeSettings?.phone ? <ThemedText>Número: {yapeSettings.phone}</ThemedText> : null}
          {!showQr && !yapeSettings?.holderName && !yapeSettings?.phone ? (
            <ThemedText themeColor="textSecondary">
              La barbería no publicó datos adicionales de Yape. El pago quedará pendiente de
              verificación.
            </ThemedText>
          ) : null}
        </View>
      ) : null}
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
  optionGroup: { gap: Spacing.two },
  nestedOptions: {
    gap: Spacing.two,
    marginLeft: Spacing.three,
    paddingLeft: Spacing.three,
  },
  nestedTitle: { fontSize: TypeScale.label, fontWeight: '700' },
  styleOption: { gap: Spacing.two },
  styleImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.medium },
  yapeBox: { gap: Spacing.two, alignItems: 'flex-start', paddingTop: Spacing.one },
  qr: { width: 180, height: 180, alignSelf: 'center', borderRadius: Radius.medium },
});

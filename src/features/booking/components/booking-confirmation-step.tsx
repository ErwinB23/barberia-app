import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { formatLimaDate, formatLimaTime, formatPen } from '../booking-domain';
import type {
  AvailableSlot,
  BookingBarber,
  BookingService,
  BookingStyle,
  PaymentMethod,
  PublicBarbershop,
} from '../types';
import { BookingSelectionIndicator } from './booking-selection-indicator';
import { BookingStepHeading } from './booking-step-heading';

type YapeSettings = {
  holderName: string | null;
  phone: string | null;
  qrUrl: string | null;
} | null;

export function BookingConfirmationStep({
  barbershop,
  barbers,
  services,
  styles,
  selectedServiceIds,
  selectedStyles,
  selectedSlot,
  totalDurationMinutes,
  totalPrice,
  paymentMethod,
  yapeSettings,
  submissionError,
  onSelectPayment,
}: {
  barbershop: PublicBarbershop;
  barbers: BookingBarber[];
  services: BookingService[];
  styles: BookingStyle[];
  selectedServiceIds: string[];
  selectedStyles: Record<string, string>;
  selectedSlot: AvailableSlot;
  totalDurationMinutes: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  yapeSettings: YapeSettings;
  submissionError: string | null;
  onSelectPayment: (method: PaymentMethod) => void;
}) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const isWide = width >= Layout.wideBreakpoint;
  const barber = barbers.find((candidate) => candidate.id === selectedSlot.barberId);
  const selectedServices = selectedServiceIds
    .map((serviceId) => services.find((service) => service.id === serviceId))
    .filter((service): service is BookingService => Boolean(service));

  return (
    <View style={stylesSheet.step}>
      <BookingStepHeading
        description="Revisa los datos y el método de pago. Puedes volver atrás sin perder tu selección."
        title="Confirma tu reserva"
      />
      {submissionError ? (
        <SurfaceCard style={stylesSheet.errorCard}>
          <ThemedText style={stylesSheet.errorTitle} themeColor="danger">
            No pudimos confirmar todavía
          </ThemedText>
          <ThemedText style={stylesSheet.errorCopy} themeColor="textSecondary">
            {submissionError}
          </ThemedText>
        </SurfaceCard>
      ) : null}
      <View style={[stylesSheet.columns, isWide ? stylesSheet.columnsWide : null]}>
        <View style={stylesSheet.column}>
          <SurfaceCard style={stylesSheet.card}>
            <ThemedText style={stylesSheet.sectionTitle}>Tu cita</ThemedText>
            <DetailLine label="Barbería" value={barbershop.name} />
            <DetailLine label="Profesional" value={barber?.displayName ?? 'Profesional elegido'} />
            <DetailLine label="Fecha" value={formatLimaDate(selectedSlot.startsAt)} />
            <DetailLine
              label="Horario"
              value={`${formatLimaTime(selectedSlot.startsAt)} a ${formatLimaTime(selectedSlot.endsAt)}`}
            />
          </SurfaceCard>

          <SurfaceCard style={stylesSheet.card}>
            <ThemedText style={stylesSheet.sectionTitle}>Servicios</ThemedText>
            <View style={stylesSheet.serviceList}>
              {selectedServices.map((service) => {
                const style = styles.find(
                  (candidate) => candidate.id === selectedStyles[service.id],
                );
                return (
                  <View key={service.id} style={stylesSheet.serviceRow}>
                    <View style={stylesSheet.serviceCopy}>
                      <ThemedText style={stylesSheet.serviceName}>{service.name}</ThemedText>
                      {style ? (
                        <ThemedText style={stylesSheet.styleName} themeColor="textSecondary">
                          Estilo: {style.name}
                        </ThemedText>
                      ) : null}
                    </View>
                    <ThemedText style={stylesSheet.servicePrice}>
                      {formatPen(service.price)}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
            <View style={[stylesSheet.totalBlock, { borderTopColor: theme.border }]}>
              <DetailLine label="Duración estimada" value={`${totalDurationMinutes} min`} />
              <DetailLine label="Total" prominent value={formatPen(totalPrice)} />
            </View>
          </SurfaceCard>
        </View>

        <View style={stylesSheet.column}>
          <SurfaceCard style={stylesSheet.card}>
            <View style={stylesSheet.paymentHeading}>
              <ThemedText style={stylesSheet.sectionTitle}>Método de pago</ThemedText>
              <ThemedText style={stylesSheet.paymentNote} themeColor="textSecondary">
                La reserva se confirma aunque el pago quede pendiente.
              </ThemedText>
            </View>
            <PaymentOption
              description="Paga directamente en la barbería. El personal autorizado confirmará el efectivo."
              icon={{ ios: 'banknote', android: 'payments', web: 'payments' }}
              isSelected={paymentMethod === 'cash'}
              label="Efectivo"
              onPress={() => onSelectPayment('cash')}
            />
            <PaymentOption
              description="Envía el pago con los datos publicados. Un administrador verificará el Yape."
              icon={{ ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' }}
              isSelected={paymentMethod === 'yape'}
              label="Yape"
              onPress={() => onSelectPayment('yape')}
            />
            {paymentMethod === 'yape' ? <YapeInstructions settings={yapeSettings} /> : null}
          </SurfaceCard>
          <View style={stylesSheet.finalNote}>
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'lock.shield', android: 'verified_user', web: 'verified_user' }}
              size={20}
            />
            <ThemedText style={stylesSheet.finalNoteCopy} themeColor="textSecondary">
              El horario, precio y duración se validan y guardan de forma segura al confirmar.
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

function DetailLine({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <View style={stylesSheet.detailLine}>
      <ThemedText style={stylesSheet.detailLabel} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText
        selectable
        style={[stylesSheet.detailValue, prominent ? stylesSheet.prominentValue : null]}
      >
        {value}
      </ThemedText>
    </View>
  );
}

function PaymentOption({
  label,
  description,
  icon,
  isSelected,
  onPress,
}: {
  label: string;
  description: string;
  icon: Parameters<typeof AppIcon>[0]['name'];
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={`${label}. ${description}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        stylesSheet.paymentOption,
        {
          backgroundColor: isSelected ? theme.surfaceMuted : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      <View style={[stylesSheet.paymentIcon, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon color={theme.primary} name={icon} size={24} />
      </View>
      <View style={stylesSheet.paymentCopy}>
        <ThemedText style={stylesSheet.paymentLabel}>{label}</ThemedText>
        <ThemedText style={stylesSheet.paymentDescription} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <BookingSelectionIndicator selected={isSelected} />
    </Pressable>
  );
}

function YapeInstructions({ settings }: { settings: YapeSettings }) {
  const theme = useTheme();
  const showQr = settings?.qrUrl?.startsWith('https://');
  const hasInstructions = showQr || settings?.holderName || settings?.phone;

  return (
    <View
      accessibilityLabel="Instrucciones de pago por Yape"
      style={[stylesSheet.yapeBox, { backgroundColor: theme.surfaceMuted }]}
    >
      {showQr ? (
        <Image
          accessibilityLabel="Código QR de Yape de la barbería"
          contentFit="contain"
          source={{ uri: settings!.qrUrl! }}
          style={[stylesSheet.qr, { backgroundColor: theme.surface }]}
        />
      ) : null}
      {settings?.holderName ? <DetailLine label="Titular" value={settings.holderName} /> : null}
      {settings?.phone ? <DetailLine label="Número" value={settings.phone} /> : null}
      {!hasInstructions ? (
        <ThemedText style={stylesSheet.paymentDescription} themeColor="textSecondary">
          La barbería no publicó datos adicionales. El pago quedará pendiente de verificación.
        </ThemedText>
      ) : null}
    </View>
  );
}

const stylesSheet = StyleSheet.create({
  step: { gap: Spacing.four },
  columns: { gap: Spacing.three },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { minWidth: 0, flex: 1, gap: Spacing.three },
  card: { gap: Spacing.three, padding: Spacing.four },
  errorCard: { gap: Spacing.two, borderRadius: Radius.medium, padding: Spacing.three },
  errorTitle: { fontSize: TypeScale.body, fontWeight: '800' },
  errorCopy: { fontSize: TypeScale.label, lineHeight: 21 },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  detailLabel: { minWidth: 104, flexShrink: 0, fontSize: TypeScale.label },
  detailValue: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: TypeScale.label,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  prominentValue: { fontSize: TypeScale.title, fontWeight: '800' },
  serviceList: { gap: Spacing.three },
  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  serviceCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  serviceName: { fontSize: TypeScale.body, fontWeight: '800' },
  styleName: { fontSize: TypeScale.caption, lineHeight: 18 },
  servicePrice: { fontSize: TypeScale.label, fontWeight: '800', fontVariant: ['tabular-nums'] },
  totalBlock: { gap: Spacing.two, borderTopWidth: 1, paddingTop: Spacing.three },
  paymentHeading: { gap: Spacing.one },
  paymentNote: { fontSize: TypeScale.label, lineHeight: 21 },
  paymentOption: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.medium,
  },
  paymentCopy: { minWidth: 0, flex: 1, gap: Spacing.one },
  paymentLabel: { fontSize: TypeScale.body, fontWeight: '800' },
  paymentDescription: { fontSize: TypeScale.label, lineHeight: 21 },
  yapeBox: { gap: Spacing.three, borderRadius: Radius.medium, padding: Spacing.three },
  qr: { width: 196, height: 196, alignSelf: 'center', borderRadius: Radius.medium },
  finalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  finalNoteCopy: { minWidth: 0, flex: 1, fontSize: TypeScale.caption, lineHeight: 19 },
});

import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';

import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { formatPen, getWeekdayLabel, WEEKDAYS_MONDAY_FIRST } from '../booking-domain';
import { useFocusedResource } from '../hooks/use-focused-resource';
import { getPublicBarbershopDetail } from '../queries';

export function PublicBarbershopDetailScreen({ barbershopId }: { barbershopId: string | null }) {
  const load = useCallback(
    () => (barbershopId ? getPublicBarbershopDetail(barbershopId) : Promise.resolve(null)),
    [barbershopId],
  );
  const { data, isLoading, error, reload } = useFocusedResource(load);

  if (isLoading && !data) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Cargando barbería…</ThemedText>
      </ThemedView>
    );
  }

  if (!barbershopId || !data) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'Esta barbería no está disponible públicamente.'} />
        <ActionButton
          label="Volver a explorar"
          onPress={() => router.replace('/explore' as Href)}
        />
      </ThemedView>
    );
  }

  const { barbershop, hours, services } = data;
  const showLogo = barbershop.logoUrl?.startsWith('https://');

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {showLogo ? (
          <Image
            accessibilityLabel={`Logo de ${barbershop.name}`}
            contentFit="cover"
            source={{ uri: barbershop.logoUrl! }}
            style={styles.logo}
          />
        ) : null}
        <ScreenHeading
          description={barbershop.description ?? 'Servicios profesionales con reserva previa.'}
          eyebrow={barbershop.status === 'published' ? 'Agenda disponible' : 'Agenda pausada'}
          title={barbershop.name}
        />
        {error ? <StatusMessage message={error} /> : null}
        {barbershop.status === 'paused' ? (
          <StatusMessage message="Puedes consultar la información, pero esta barbería no acepta nuevas reservas por ahora." />
        ) : (
          <ActionButton
            disabled={services.length === 0}
            label="Reservar una cita"
            onPress={() => router.push(`/booking/${barbershop.id}` as Href)}
          />
        )}

        <SurfaceCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Información</ThemedText>
          {barbershop.address ? <InfoLine label="Dirección" value={barbershop.address} /> : null}
          {barbershop.locationReference ? (
            <InfoLine label="Referencia" value={barbershop.locationReference} />
          ) : null}
          {barbershop.phone ? <InfoLine label="Teléfono" value={barbershop.phone} /> : null}
          {!barbershop.address && !barbershop.locationReference && !barbershop.phone ? (
            <ThemedText themeColor="textSecondary">
              Sin información de contacto publicada.
            </ThemedText>
          ) : null}
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Horario habitual</ThemedText>
          {WEEKDAYS_MONDAY_FIRST.map((weekday) => {
            const dayHours = hours.filter((hour) => hour.weekday === weekday);
            return (
              <View key={weekday} style={styles.hourRow}>
                <ThemedText style={styles.hourDay}>{getWeekdayLabel(weekday)}</ThemedText>
                <ThemedText style={styles.hourValue} themeColor="textSecondary">
                  {dayHours.length > 0
                    ? dayHours.map((hour) => `${hour.startTime} – ${hour.endTime}`).join('\n')
                    : 'Cerrado'}
                </ThemedText>
              </View>
            );
          })}
        </SurfaceCard>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Servicios</ThemedText>
          {services.length === 0 ? (
            <SurfaceCard style={styles.card}>
              <ThemedText themeColor="textSecondary">
                No hay servicios activos disponibles para reservar.
              </ThemedText>
            </SurfaceCard>
          ) : (
            services.map((service) => (
              <SurfaceCard key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceCopy}>
                  <ThemedText style={styles.serviceName}>{service.name}</ThemedText>
                  {service.description ? (
                    <ThemedText style={styles.serviceDescription} themeColor="textSecondary">
                      {service.description}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.serviceMeta}>
                  <ThemedText style={styles.price}>{formatPen(service.price)}</ThemedText>
                  <ThemedText themeColor="textSecondary">{service.durationMinutes} min</ThemedText>
                </View>
              </SurfaceCard>
            ))
          )}
        </View>
        <ActionButton
          label="Actualizar información"
          onPress={() => void reload()}
          variant="secondary"
        />
      </ScrollView>
    </ThemedView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <ThemedText style={styles.infoLabel} themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
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
  logo: { width: '100%', aspectRatio: 16 / 7, borderRadius: Radius.large },
  card: { gap: Spacing.three, padding: Spacing.four },
  section: { gap: Spacing.three },
  sectionTitle: { fontSize: TypeScale.title, fontWeight: '700' },
  infoLine: { gap: Spacing.one },
  infoLabel: { fontSize: TypeScale.caption, fontWeight: '700' },
  infoValue: { fontSize: TypeScale.body },
  hourRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  hourDay: { width: 92, fontSize: TypeScale.label, fontWeight: '700' },
  hourValue: { flex: 1, fontSize: TypeScale.label, lineHeight: 21 },
  serviceCard: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.four },
  serviceCopy: { flex: 1, gap: Spacing.one },
  serviceName: { fontSize: TypeScale.body, fontWeight: '700' },
  serviceDescription: { fontSize: TypeScale.label, lineHeight: 20 },
  serviceMeta: { alignItems: 'flex-end', gap: Spacing.one },
  price: { fontSize: TypeScale.body, fontWeight: '700' },
});

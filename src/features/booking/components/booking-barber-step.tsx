import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import type { BookingBarber } from '../types';
import { BookingSelectionIndicator } from './booking-selection-indicator';
import { BookingStepHeading } from './booking-step-heading';

export function BookingBarberStep({
  barbers,
  eligibleBarberIds,
  barberChoice,
  onSelectBarber,
  title = 'Elige a tu profesional',
  description = 'Solo aparecen profesionales que pueden realizar todos los servicios elegidos.',
  anyOptionDescription = 'Compara los horarios de todos. Elegirás un profesional concreto al seleccionar el turno.',
}: {
  barbers: BookingBarber[];
  eligibleBarberIds: string[];
  barberChoice: 'any' | string;
  onSelectBarber: (barberId: 'any' | string) => void;
  title?: string;
  description?: string;
  anyOptionDescription?: string;
}) {
  const eligibleBarbers = barbers.filter((barber) => eligibleBarberIds.includes(barber.id));

  return (
    <View style={styles.step}>
      <BookingStepHeading description={description} title={title} />
      {eligibleBarbers.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText style={styles.emptyTitle}>No hay una combinación disponible</ThemedText>
          <ThemedText themeColor="textSecondary">
            Vuelve a Servicios y ajusta tu selección para encontrar un profesional compatible.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.options}>
          <AnyBarberOption
            description={anyOptionDescription}
            isSelected={barberChoice === 'any'}
            onPress={() => onSelectBarber('any')}
          />
          {eligibleBarbers.map((barber) => (
            <BarberOption
              barber={barber}
              isSelected={barberChoice === barber.id}
              key={barber.id}
              onPress={() => onSelectBarber(barber.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function AnyBarberOption({
  description,
  isSelected,
  onPress,
}: {
  description: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel="Cualquier barbero disponible"
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected ? theme.surfaceMuted : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      <View style={[styles.avatar, styles.fallback, { backgroundColor: theme.surfaceMuted }]}>
        <AppIcon
          color={theme.primary}
          name={{ ios: 'person.2', android: 'groups', web: 'groups' }}
          size={28}
        />
      </View>
      <View style={styles.copy}>
        <ThemedText style={styles.name}>Cualquier barbero disponible</ThemedText>
        <ThemedText style={styles.bio} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <BookingSelectionIndicator selected={isSelected} />
    </Pressable>
  );
}

function BarberOption({
  barber,
  isSelected,
  onPress,
}: {
  barber: BookingBarber;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const showPhoto = barber.photoUrl?.startsWith('https://');
  const initial = barber.displayName.trim().charAt(0).toLocaleUpperCase('es-PE');

  return (
    <Pressable
      accessibilityLabel={`Reservar con ${barber.displayName}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected ? theme.surfaceMuted : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      {showPhoto ? (
        <Image
          accessibilityLabel={`Foto de ${barber.displayName}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={barber.id}
          source={{ uri: barber.photoUrl! }}
          style={[styles.avatar, { backgroundColor: theme.surfaceMuted }]}
          transition={160}
        />
      ) : (
        <View style={[styles.avatar, styles.fallback, { backgroundColor: theme.surfaceMuted }]}>
          <ThemedText style={styles.initial} themeColor="primary">
            {initial || 'B'}
          </ThemedText>
        </View>
      )}
      <View style={styles.copy}>
        <ThemedText style={styles.name}>{barber.displayName}</ThemedText>
        <ThemedText numberOfLines={3} style={styles.bio} themeColor="textSecondary">
          {barber.bio ?? 'Profesional disponible para los servicios seleccionados.'}
        </ThemedText>
      </View>
      <BookingSelectionIndicator selected={isSelected} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  step: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  options: { gap: Spacing.three },
  card: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  avatar: { width: 64, height: 64, borderRadius: Radius.pill },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: TypeScale.headline, fontWeight: '800' },
  copy: { minWidth: 0, flex: 1, gap: Spacing.one },
  name: { fontSize: TypeScale.title, fontWeight: '800' },
  bio: { fontSize: TypeScale.label, lineHeight: 21 },
  empty: {
    gap: Spacing.two,
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
  emptyTitle: { fontSize: TypeScale.title, fontWeight: '800' },
});

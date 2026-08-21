import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { FavoriteBarbershopControls } from '@/features/favorites/components/favorite-barbershop-controls';
import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import type { PublicBarbershop } from '../types';

export function PublicBarbershopHero({
  barbershop,
  canBook,
  isWide,
  onBook,
}: {
  barbershop: PublicBarbershop;
  canBook: boolean;
  isWide: boolean;
  onBook: () => void;
}) {
  const theme = useTheme();
  const showLogo = barbershop.logoUrl?.startsWith('https://');
  const isPaused = barbershop.status === 'paused';

  return (
    <View style={[styles.hero, isWide ? styles.heroWide : null]}>
      <View style={[styles.media, isWide ? styles.mediaWide : null]}>
        {showLogo ? (
          <Image
            accessibilityLabel={`Imagen de ${barbershop.name}`}
            cachePolicy="memory-disk"
            contentFit="cover"
            priority="high"
            source={{ uri: barbershop.logoUrl! }}
            style={[styles.image, { backgroundColor: theme.surfaceMuted }]}
            transition={180}
          />
        ) : (
          <View
            accessible
            accessibilityLabel={`${barbershop.name}, sin imagen publicada`}
            accessibilityRole="image"
            style={[styles.image, styles.fallback, { backgroundColor: theme.surfaceMuted }]}
          >
            <AppIcon
              color={theme.primary}
              name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
              size={52}
            />
          </View>
        )}
      </View>

      <View style={[styles.copy, isWide ? styles.copyWide : null]}>
        <View style={styles.status}>
          <AppIcon
            color={isPaused ? theme.warning : theme.success}
            name={
              isPaused
                ? { ios: 'pause.circle', android: 'pause_circle', web: 'pause_circle' }
                : { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }
            }
            size={17}
          />
          <ThemedText
            style={[styles.statusLabel, { color: isPaused ? theme.warning : theme.success }]}
          >
            {isPaused ? 'Reservas pausadas' : 'Agenda disponible'}
          </ThemedText>
        </View>

        <View style={styles.heading}>
          <ThemedText accessibilityRole="header" style={styles.title}>
            {barbershop.name}
          </ThemedText>
          <ThemedText style={styles.description} themeColor="textSecondary">
            {barbershop.description ?? 'Esta barbería aún no publicó una descripción.'}
          </ThemedText>
        </View>

        <View style={styles.contactGroup}>
          {barbershop.address ? (
            <ContactLine
              icon={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
              value={barbershop.address}
            />
          ) : null}
          {barbershop.locationReference ? (
            <ContactLine
              icon={{ ios: 'signpost.right', android: 'near_me', web: 'near_me' }}
              value={barbershop.locationReference}
            />
          ) : null}
          {barbershop.phone ? (
            <ContactLine
              icon={{ ios: 'phone', android: 'call', web: 'call' }}
              selectable
              value={barbershop.phone}
            />
          ) : null}
        </View>

        <FavoriteBarbershopControls barbershopId={barbershop.id} />

        {isPaused ? (
          <View style={[styles.pausedNotice, { backgroundColor: theme.warningSurface }]}>
            <ThemedText style={[styles.pausedTitle, { color: theme.warning }]}>
              Agenda pausada
            </ThemedText>
            <ThemedText style={styles.pausedDescription}>
              Puedes consultar sus servicios y profesionales, pero no crear una reserva ahora.
            </ThemedText>
          </View>
        ) : (
          <ActionButton
            disabled={!canBook}
            label={canBook ? 'Reservar cita' : 'Sin servicios para reservar'}
            onPress={onBook}
          />
        )}
      </View>
    </View>
  );
}

function ContactLine({
  icon,
  selectable = false,
  value,
}: {
  icon: Parameters<typeof AppIcon>[0]['name'];
  selectable?: boolean;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.contactLine}>
      <AppIcon color={theme.textSecondary} name={icon} size={18} />
      <ThemedText selectable={selectable} style={styles.contactValue} themeColor="textSecondary">
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.four,
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.five,
  },
  media: {
    minWidth: 0,
    width: '100%',
  },
  mediaWide: {
    width: 'auto',
    flex: 1.15,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    minWidth: 0,
    width: '100%',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  copyWide: {
    width: 'auto',
    flex: 0.85,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusLabel: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  heading: {
    gap: Spacing.two,
  },
  title: {
    fontSize: TypeScale.display,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  description: {
    maxWidth: 620,
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
  contactGroup: {
    gap: Spacing.two,
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  contactValue: {
    flex: 1,
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  pausedNotice: {
    gap: Spacing.one,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  pausedTitle: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  pausedDescription: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
});

import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { formatPen } from '../booking-domain';
import type { BookingService, BookingStyle } from '../types';

export function PublicServiceCard({
  service,
  serviceStyles,
}: {
  service: BookingService;
  serviceStyles: BookingStyle[];
}) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <ThemedText style={styles.name}>{service.name}</ThemedText>
          {service.description ? (
            <ThemedText style={styles.description} themeColor="textSecondary">
              {service.description}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.meta}>
          <ThemedText style={styles.price}>{formatPen(service.price)}</ThemedText>
          <View style={styles.durationRow}>
            <DurationIcon />
            <ThemedText style={styles.duration} themeColor="textSecondary">
              {service.durationMinutes} min
            </ThemedText>
          </View>
        </View>
      </View>

      {serviceStyles.length > 0 ? (
        <View style={styles.stylesSection}>
          <ThemedText style={styles.stylesTitle}>Estilos de referencia</ThemedText>
          <ScrollView
            horizontal
            contentContainerStyle={styles.stylesList}
            showsHorizontalScrollIndicator={false}
          >
            {serviceStyles.map((style) => (
              <PublicStyleReference key={style.id} style={style} />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </SurfaceCard>
  );
}

function DurationIcon() {
  const theme = useTheme();

  return (
    <AppIcon
      color={theme.textSecondary}
      name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
      size={15}
    />
  );
}

function PublicStyleReference({ style }: { style: BookingStyle }) {
  const theme = useTheme();
  const showImage = style.imageUrl?.startsWith('https://');

  return (
    <View style={[styles.styleCard, { backgroundColor: theme.surfaceMuted }]}>
      {showImage ? (
        <Image
          accessibilityLabel={`Referencia visual de ${style.name}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={style.id}
          source={{ uri: style.imageUrl! }}
          style={styles.styleImage}
          transition={180}
        />
      ) : (
        <View style={styles.styleFallback}>
          <AppIcon
            color={theme.primary}
            name={{ ios: 'photo', android: 'image', web: 'image' }}
            size={24}
          />
        </View>
      )}
      <View style={styles.styleCopy}>
        <ThemedText numberOfLines={2} style={styles.styleName}>
          {style.name}
        </ThemedText>
        {style.description ? (
          <ThemedText numberOfLines={2} style={styles.styleDescription} themeColor="textSecondary">
            {style.description}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    overflow: 'hidden',
    padding: Spacing.four,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
  },
  name: {
    fontSize: TypeScale.title,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  meta: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  price: {
    fontSize: TypeScale.body,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  duration: {
    fontSize: TypeScale.caption,
    fontVariant: ['tabular-nums'],
  },
  stylesSection: {
    gap: Spacing.two,
  },
  stylesTitle: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  stylesList: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  styleCard: {
    width: 164,
    overflow: 'hidden',
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  styleImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  styleFallback: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleCopy: {
    minHeight: 70,
    gap: Spacing.one,
    padding: Spacing.two,
  },
  styleName: {
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  styleDescription: {
    fontSize: TypeScale.caption,
    lineHeight: 18,
  },
});

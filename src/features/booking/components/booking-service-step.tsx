import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

import { formatPen } from '../booking-domain';
import type { BookingService, BookingStyle } from '../types';
import { BookingSelectionIndicator } from './booking-selection-indicator';
import { BookingStepHeading } from './booking-step-heading';

export function BookingServiceStep({
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
    <View style={stylesSheet.step}>
      <BookingStepHeading
        description="Combina los servicios que necesitas. Verás el total y la duración antes de continuar."
        title="¿Qué te gustaría reservar?"
      />
      {services.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          Esta barbería no tiene servicios activos para reservar.
        </ThemedText>
      ) : (
        <View style={stylesSheet.serviceList}>
          {services.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id);
            const serviceStyles = styles.filter((style) => style.serviceId === service.id);
            return (
              <View key={service.id} style={stylesSheet.serviceGroup}>
                <ServiceOption
                  isSelected={isSelected}
                  onPress={() => onToggleService(service.id)}
                  service={service}
                />
                {isSelected && serviceStyles.length > 0 ? (
                  <StylePicker
                    onSelect={(styleId) => onSelectStyle(service.id, styleId)}
                    selectedStyleId={selectedStyles[service.id] ?? null}
                    serviceName={service.name}
                    styles={serviceStyles}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ServiceOption({
  service,
  isSelected,
  onPress,
}: {
  service: BookingService;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={`${service.name}, ${formatPen(service.price)}, ${service.durationMinutes} minutos`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        stylesSheet.serviceCard,
        {
          backgroundColor: isSelected ? theme.surfaceMuted : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
          boxShadow: isSelected ? `0 8px 24px ${theme.cardShadow}` : undefined,
        },
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      <View style={stylesSheet.serviceHeader}>
        <View style={stylesSheet.serviceCopy}>
          <ThemedText style={stylesSheet.serviceName}>{service.name}</ThemedText>
          {service.description ? (
            <ThemedText style={stylesSheet.description} themeColor="textSecondary">
              {service.description}
            </ThemedText>
          ) : null}
        </View>
        <BookingSelectionIndicator selected={isSelected} type="checkbox" />
      </View>
      <View style={stylesSheet.metaRow}>
        <ThemedText style={stylesSheet.price} themeColor="primary">
          {formatPen(service.price)}
        </ThemedText>
        <ThemedText style={stylesSheet.duration} themeColor="textSecondary">
          {service.durationMinutes} min
        </ThemedText>
      </View>
    </Pressable>
  );
}

function StylePicker({
  serviceName,
  styles,
  selectedStyleId,
  onSelect,
}: {
  serviceName: string;
  styles: BookingStyle[];
  selectedStyleId: string | null;
  onSelect: (styleId: string | null) => void;
}) {
  return (
    <View style={stylesSheet.styleSection}>
      <View style={stylesSheet.styleHeading}>
        <ThemedText style={stylesSheet.styleTitle}>Estilo de referencia</ThemedText>
        <ThemedText style={stylesSheet.optional} themeColor="textSecondary">
          Opcional, no cambia precio ni duración
        </ThemedText>
      </View>
      <ScrollView
        contentContainerStyle={stylesSheet.styleList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <StyleOption
          accessibilityLabel={`Sin estilo específico para ${serviceName}`}
          isSelected={selectedStyleId === null}
          name="Sin estilo"
          onPress={() => onSelect(null)}
        />
        {styles.map((style) => (
          <StyleOption
            accessibilityLabel={`${style.name}, estilo opcional para ${serviceName}`}
            description={style.description}
            imageUrl={style.imageUrl}
            isSelected={selectedStyleId === style.id}
            key={style.id}
            name={style.name}
            onPress={() => onSelect(style.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function StyleOption({
  name,
  description,
  imageUrl,
  isSelected,
  accessibilityLabel,
  onPress,
}: {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isSelected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const showImage = imageUrl?.startsWith('https://');

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        stylesSheet.styleCard,
        {
          backgroundColor: isSelected ? theme.surfaceMuted : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
        pressed ? { backgroundColor: theme.surfaceMuted } : null,
      ]}
    >
      {showImage ? (
        <Image
          accessibilityLabel={`Referencia visual de ${name}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={{ uri: imageUrl! }}
          style={[stylesSheet.styleImage, { backgroundColor: theme.surfaceMuted }]}
          transition={160}
        />
      ) : null}
      <View style={stylesSheet.styleCopy}>
        <View style={stylesSheet.styleNameRow}>
          <ThemedText numberOfLines={2} style={stylesSheet.styleName}>
            {name}
          </ThemedText>
          <BookingSelectionIndicator selected={isSelected} />
        </View>
        {description ? (
          <ThemedText
            numberOfLines={2}
            style={stylesSheet.styleDescription}
            themeColor="textSecondary"
          >
            {description}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const stylesSheet = StyleSheet.create({
  step: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
  },
  serviceList: { gap: Spacing.three },
  serviceGroup: { gap: Spacing.three },
  serviceCard: {
    minHeight: 112,
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  serviceCopy: { flex: 1, gap: Spacing.one },
  serviceName: { fontSize: TypeScale.title, fontWeight: '800' },
  description: { fontSize: TypeScale.label, lineHeight: 21 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  price: { fontSize: TypeScale.body, fontWeight: '800', fontVariant: ['tabular-nums'] },
  duration: { fontSize: TypeScale.label, fontWeight: '700', fontVariant: ['tabular-nums'] },
  styleSection: {
    gap: Spacing.three,
    paddingLeft: Spacing.two,
  },
  styleHeading: { gap: Spacing.one },
  styleTitle: { fontSize: TypeScale.body, fontWeight: '800' },
  optional: { fontSize: TypeScale.caption, lineHeight: 18 },
  styleList: { gap: Spacing.two, paddingRight: Spacing.four },
  styleCard: {
    width: 168,
    minHeight: 96,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  styleImage: { width: '100%', height: 88 },
  styleCopy: { gap: Spacing.one, padding: Spacing.two },
  styleNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  styleName: { minWidth: 0, flex: 1, fontSize: TypeScale.label, fontWeight: '800' },
  styleDescription: { fontSize: TypeScale.caption, lineHeight: 18 },
});

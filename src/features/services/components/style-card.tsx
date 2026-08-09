import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import type { CatalogStyle } from '../types';
import { isSafeImageUrl } from '../validation';
import { CatalogStatusBadge } from './catalog-status-badge';

type StyleCardProps = {
  style: CatalogStyle;
  isChangingStatus: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
};

export function StyleCard({ style, isChangingStatus, onEdit, onToggleStatus }: StyleCardProps) {
  const theme = useTheme();
  const imageUrl = style.imageUrl && isSafeImageUrl(style.imageUrl) ? style.imageUrl : null;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.content}>
        {imageUrl ? (
          <Image
            accessibilityLabel={`Referencia visual de ${style.name}`}
            contentFit="cover"
            source={{ uri: imageUrl }}
            style={[styles.image, { backgroundColor: theme.surfaceMuted }]}
          />
        ) : (
          <View
            style={[styles.image, styles.imagePlaceholder, { backgroundColor: theme.surfaceMuted }]}
          >
            <ThemedText style={styles.placeholderLabel} themeColor="textSecondary">
              Sin imagen
            </ThemedText>
          </View>
        )}
        <View style={styles.copy}>
          <View style={styles.heading}>
            <ThemedText style={styles.title}>{style.name}</ThemedText>
            <CatalogStatusBadge isActive={style.isActive} />
          </View>
          {style.description ? (
            <ThemedText style={styles.description} themeColor="textSecondary">
              {style.description}
            </ThemedText>
          ) : (
            <ThemedText style={styles.description} themeColor="textSecondary">
              Sin descripción.
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <ActionButton label="Editar estilo" onPress={onEdit} variant="secondary" />
        <ActionButton
          isLoading={isChangingStatus}
          label={style.isActive ? 'Desactivar' : 'Activar'}
          onPress={onToggleStatus}
          variant={style.isActive ? 'danger' : 'secondary'}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: Radius.medium,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
  },
  placeholderLabel: {
    textAlign: 'center',
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    gap: Spacing.two,
  },
  heading: {
    gap: Spacing.two,
  },
  title: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  description: {
    fontSize: TypeScale.label,
    lineHeight: 21,
  },
  actions: {
    gap: Spacing.two,
  },
});

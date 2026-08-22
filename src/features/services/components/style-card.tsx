import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ActionButton } from '@/shared/components/ui/action-button';
import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
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
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const imageUrl = style.imageUrl && isSafeImageUrl(style.imageUrl) ? style.imageUrl : null;

  return (
    <SurfaceCard style={styles.card}>
      <Pressable
        accessibilityHint="Abre la edición de este estilo"
        accessibilityLabel={`${style.name}, ${style.isActive ? 'activo' : 'inactivo'}`}
        accessibilityRole="button"
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onPress={onEdit}
        style={({ pressed }) => [
          styles.openArea,
          isFocused ? { boxShadow: `inset 0 0 0 2px ${theme.focus}` } : null,
          getPressedScaleStyle(pressed, reduceMotion, 0.992),
        ]}
      >
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
            <AppIcon
              color={theme.textSecondary}
              name={{ ios: 'photo', android: 'image', web: 'image' }}
              size={24}
            />
          </View>
        )}
        <View style={styles.copy}>
          <View style={styles.heading}>
            <ThemedText numberOfLines={2} style={styles.title}>
              {style.name}
            </ThemedText>
            <CatalogStatusBadge isActive={style.isActive} />
          </View>
          <ThemedText numberOfLines={2} style={styles.description} themeColor="textSecondary">
            {style.description ?? 'Sin descripción.'}
          </ThemedText>
        </View>
        <AppIcon
          color={theme.textSecondary}
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={20}
        />
      </Pressable>
      <View style={[styles.statusAction, { borderTopColor: theme.border }]}>
        <ActionButton
          isLoading={isChangingStatus}
          label={style.isActive ? 'Desactivar estilo' : 'Activar estilo'}
          onPress={onToggleStatus}
          size="compact"
          variant={style.isActive ? 'danger' : 'secondary'}
        />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  openArea: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  image: { width: 80, height: 80, borderRadius: Radius.medium },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  copy: { minWidth: 0, flex: 1, gap: Spacing.two },
  heading: { gap: Spacing.two },
  title: { fontSize: TypeScale.body, fontWeight: '700' },
  description: { fontSize: TypeScale.label, lineHeight: 21 },
  statusAction: {
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
});

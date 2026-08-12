import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { isSafeRemoteImageUrl } from '../barber-domain';
import type { Barber } from '../types';

export function BarberCard({ barber, onOpen }: { barber: Barber; onOpen: () => void }) {
  const theme = useTheme();
  const initial = barber.displayName.trim().charAt(0).toUpperCase();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.heading}>
        {isSafeRemoteImageUrl(barber.photoUrl) ? (
          <Image
            accessibilityLabel={`Foto de ${barber.displayName}`}
            source={{ uri: barber.photoUrl! }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.surfaceMuted }]}
          >
            <ThemedText style={styles.initial}>{initial}</ThemedText>
          </View>
        )}
        <View style={styles.copy}>
          <ThemedText style={styles.name}>{barber.displayName}</ThemedText>
          <ThemedText
            style={{
              color: barber.isActive ? theme.success : theme.textSecondary,
              fontWeight: '700',
            }}
          >
            {barber.isActive ? 'Activo' : 'Inactivo'}
          </ThemedText>
        </View>
      </View>
      <ThemedText numberOfLines={3} style={styles.bio} themeColor="textSecondary">
        {barber.bio ?? 'Sin descripción pública.'}
      </ThemedText>
      <ThemedText style={styles.services} themeColor="textSecondary">
        {barber.services.length > 0
          ? barber.services.map((service) => service.name).join(' · ')
          : 'Sin servicios asignados'}
      </ThemedText>
      <ActionButton label="Ver perfil" onPress={onOpen} variant="secondary" />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 64, height: 64, borderRadius: Radius.pill },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: TypeScale.headline, fontWeight: '800' },
  copy: { flex: 1, gap: Spacing.one },
  name: { fontSize: TypeScale.title, fontWeight: '700' },
  bio: { fontSize: TypeScale.label, lineHeight: 21 },
  services: { fontSize: TypeScale.caption, lineHeight: 18 },
});

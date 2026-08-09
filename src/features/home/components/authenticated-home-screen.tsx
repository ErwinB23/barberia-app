import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ActionButton } from '@/shared/components/ui/action-button';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

export function AuthenticatedHomeScreen() {
  const { user } = useAuth();
  const { profile, error } = useProfile(user!);
  const firstName = profile?.fullName?.trim().split(/\s+/)[0];

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <ScreenHeading
          description="Administra tus espacios y prepara cada barbería para sus próximos módulos."
          eyebrow="Inicio"
          title={firstName ? `Hola, ${firstName}` : 'Bienvenido'}
        />
        {error ? <StatusMessage message={error} /> : null}
        <SurfaceCard style={styles.primaryCard}>
          <View style={styles.cardCopy}>
            <ThemedText style={styles.cardTitle}>Gestión de barberías</ThemedText>
            <ThemedText style={styles.cardDescription} themeColor="textSecondary">
              Consulta tus roles, crea una barbería y configura sus datos generales.
            </ThemedText>
          </View>
          <ActionButton label="Ver mis barberías" onPress={() => router.push('/barbershops')} />
          <ActionButton
            label="Crear barbería"
            onPress={() => router.push('/barbershops/create')}
            variant="secondary"
          />
        </SurfaceCard>
        <SurfaceCard style={styles.secondaryCard}>
          <View style={styles.cardCopy}>
            <ThemedText style={styles.cardTitle}>Cuenta personal</ThemedText>
            <ThemedText style={styles.cardDescription} themeColor="textSecondary">
              Revisa los datos de tu perfil o cierra la sesión de este dispositivo.
            </ThemedText>
          </View>
          <ActionButton
            label="Ir a mi perfil"
            onPress={() => router.push('/profile')}
            variant="secondary"
          />
        </SurfaceCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  primaryCard: {
    gap: Spacing.three,
    padding: Spacing.five,
  },
  secondaryCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  cardCopy: {
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: TypeScale.title,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: TypeScale.body,
    lineHeight: 24,
  },
});

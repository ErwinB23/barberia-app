import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Layout, Radius, TypeScale } from '@/theme/tokens';

export function ReservationsListSkeleton() {
  return (
    <ThemedView style={styles.screen}>
      <View
        accessibilityLabel="Cargando tus reservas"
        accessibilityRole="progressbar"
        style={styles.listContent}
      >
        <SkeletonBlock height={14} width={104} />
        <SkeletonBlock height={40} width="68%" />
        <SkeletonBlock height={20} width="88%" />
        <View style={styles.tabsSkeleton}>
          <SkeletonBlock height={48} width="49%" />
          <SkeletonBlock height={48} width="49%" />
        </View>
        <ReservationCardSkeleton />
        <ReservationCardSkeleton />
      </View>
    </ThemedView>
  );
}

export function ReservationDetailSkeleton() {
  return (
    <ThemedView style={styles.screen}>
      <View
        accessibilityLabel="Cargando el detalle de la reserva"
        accessibilityRole="progressbar"
        style={styles.detailContent}
      >
        <SkeletonBlock height={30} width={124} />
        <SkeletonBlock height={40} width="72%" />
        <SkeletonBlock height={20} width="54%" />
        <SurfaceCard style={styles.detailCard}>
          <SkeletonBlock height={22} width="42%" />
          <SkeletonBlock height={76} width="100%" />
          <SkeletonBlock height={18} width="90%" />
          <SkeletonBlock height={18} width="74%" />
        </SurfaceCard>
        <SurfaceCard style={styles.detailCard}>
          <SkeletonBlock height={22} width="34%" />
          <SkeletonBlock height={56} width="100%" />
          <SkeletonBlock height={56} width="100%" />
        </SurfaceCard>
      </View>
    </ThemedView>
  );
}

export function ReservationLoadError({
  message,
  onRetry,
  onBack,
  title = 'No pudimos cargar esta reserva',
  description = 'Tus datos siguen seguros. Intenta nuevamente o vuelve a Mis reservas.',
}: {
  message: string;
  onRetry?: () => void;
  onBack: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <ThemedView style={styles.centered}>
      <View style={styles.errorCopy}>
        <ThemedText style={styles.errorTitle}>{title}</ThemedText>
        <ThemedText style={styles.errorDescription} themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
      <StatusMessage message={message} />
      {onRetry ? <ActionButton label="Volver a intentar" onPress={onRetry} /> : null}
      <ActionButton label="Ver mis reservas" onPress={onBack} variant="secondary" />
    </ThemedView>
  );
}

function ReservationCardSkeleton() {
  return (
    <SurfaceCard style={styles.listCard}>
      <View style={styles.row}>
        <SkeletonBlock height={24} width="54%" />
        <SkeletonBlock height={28} width={94} />
      </View>
      <SkeletonBlock height={22} width="66%" />
      <SkeletonBlock height={18} width="82%" />
      <SkeletonBlock height={18} width="58%" />
      <SkeletonBlock height={52} width="100%" />
    </SurfaceCard>
  );
}

function SkeletonBlock({ height, width }: { height: number; width: number | `${number}%` }) {
  const theme = useTheme();
  return <View style={[styles.block, { height, width, backgroundColor: theme.surfaceMuted }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  detailContent: {
    width: '100%',
    maxWidth: Layout.clientContentMaxWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  tabsSkeleton: { flexDirection: 'row', justifyContent: 'space-between' },
  listCard: { gap: Spacing.three, padding: Spacing.four },
  detailCard: { gap: Spacing.three, padding: Spacing.four },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  block: { borderRadius: Radius.small },
  centered: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.formMaxWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  errorCopy: { gap: Spacing.two },
  errorTitle: { fontSize: TypeScale.title, fontWeight: '800' },
  errorDescription: { fontSize: TypeScale.body, lineHeight: 24 },
});

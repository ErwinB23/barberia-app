import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import {
  getEffectiveInvitationStatus,
  getInvitationStatusLabel,
  type InvitationStatus,
} from '../invitation-domain';

export function InvitationStatusBadge({
  status,
  expiresAt,
}: {
  status: InvitationStatus;
  expiresAt: string;
}) {
  const theme = useTheme();
  const effectiveStatus = getEffectiveInvitationStatus(status, expiresAt);
  const palette =
    effectiveStatus === 'accepted'
      ? { color: theme.success, backgroundColor: theme.successSurface }
      : effectiveStatus === 'pending'
        ? { color: theme.warning, backgroundColor: theme.warningSurface }
        : effectiveStatus === 'rejected' || effectiveStatus === 'cancelled'
          ? { color: theme.danger, backgroundColor: theme.dangerSurface }
          : { color: theme.textSecondary, backgroundColor: theme.surfaceMuted };
  const label = getInvitationStatusLabel(effectiveStatus);

  return (
    <View
      accessibilityLabel={`Estado: ${label}`}
      style={[
        styles.badge,
        { backgroundColor: palette.backgroundColor, borderColor: palette.color },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.color }]} />
      <ThemedText style={[styles.label, { color: palette.color }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
  },
  dot: { width: 7, height: 7, borderRadius: Radius.pill },
  label: { fontSize: TypeScale.caption, fontWeight: '700' },
});

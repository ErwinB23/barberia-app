import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type Choice = { value: string; label: string; description: string };

export function InvitationChoiceField({
  label,
  choices,
  value,
  error,
  onChange,
}: {
  label: string;
  choices: readonly Choice[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <View accessibilityRole="radiogroup" style={styles.choices}>
        {choices.map((choice) => {
          const isSelected = choice.value === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              key={choice.value}
              onPress={() => onChange(choice.value)}
              style={({ pressed }) => [
                styles.choice,
                {
                  backgroundColor: isSelected ? theme.surfaceMuted : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
                pressed ? styles.pressed : null,
              ]}
            >
              <View
                style={[styles.radio, { borderColor: isSelected ? theme.primary : theme.border }]}
              >
                {isSelected ? (
                  <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
                ) : null}
              </View>
              <View style={styles.choiceCopy}>
                <ThemedText style={styles.choiceLabel}>{choice.label}</ThemedText>
                <ThemedText style={styles.choiceDescription} themeColor="textSecondary">
                  {choice.description}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <ThemedText accessibilityRole="alert" selectable style={styles.error} themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  fieldLabel: { fontSize: TypeScale.label, fontWeight: '700' },
  choices: { gap: Spacing.two },
  choice: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
  },
  pressed: { opacity: 0.72 },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: Radius.pill,
  },
  radioDot: { width: 10, height: 10, borderRadius: Radius.pill },
  choiceCopy: { flex: 1, gap: Spacing.one },
  choiceLabel: { fontSize: TypeScale.body, fontWeight: '700' },
  choiceDescription: { fontSize: TypeScale.caption, lineHeight: 18 },
  error: { fontSize: TypeScale.caption, lineHeight: 18 },
});

import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

import { ThemedText } from './themed-text';

type FormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  unit?: string;
};

export function FormField({
  label,
  error,
  helperText,
  required = false,
  unit,
  multiline = false,
  onBlur,
  onFocus,
  ...inputProps
}: FormFieldProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={styles.requirement} themeColor="textSecondary">
          {required ? 'Obligatorio' : 'Opcional'}
        </ThemedText>
      </View>
      <View
        style={[
          styles.inputShell,
          multiline ? styles.multilineShell : null,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.danger : isFocused ? theme.focus : theme.border,
          },
        ]}
      >
        <TextInput
          accessibilityHint={error ?? helperText}
          accessibilityLabel={`${label}, ${required ? 'obligatorio' : 'opcional'}`}
          multiline={multiline}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          style={[styles.input, multiline ? styles.multilineInput : null, { color: theme.text }]}
          {...inputProps}
        />
        {unit ? (
          <ThemedText style={styles.unit} themeColor="textSecondary">
            {unit}
          </ThemedText>
        ) : null}
      </View>
      {error ? (
        <ThemedText accessibilityRole="alert" selectable style={styles.error} themeColor="danger">
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText style={styles.helper} themeColor="textSecondary">
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  requirement: {
    fontSize: TypeScale.caption,
  },
  inputShell: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  multilineShell: {
    minHeight: 112,
    alignItems: 'flex-start',
  },
  input: {
    minHeight: 50,
    flex: 1,
    paddingHorizontal: Spacing.three,
    fontSize: TypeScale.body,
  },
  multilineInput: {
    minHeight: 110,
    paddingVertical: Spacing.three,
    textAlignVertical: 'top',
  },
  unit: {
    paddingRight: Spacing.three,
    fontSize: TypeScale.label,
  },
  error: {
    fontSize: TypeScale.caption,
    lineHeight: 18,
  },
  helper: {
    fontSize: TypeScale.caption,
    lineHeight: 18,
  },
});

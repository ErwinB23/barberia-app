import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type AuthFormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
};

export function AuthFormField({
  label,
  error,
  onBlur,
  onFocus,
  secureTextEntry,
  ...inputProps
}: AuthFormFieldProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = secureTextEntry === true;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={styles.required} themeColor="textSecondary">
          Obligatorio
        </ThemedText>
      </View>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.danger : isFocused ? theme.focus : theme.border,
          },
        ]}
      >
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={`${label}, obligatorio`}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          selectionColor={theme.primary}
          style={[
            styles.input,
            isPasswordField ? styles.passwordInput : null,
            { color: theme.text },
          ]}
          {...inputProps}
        />
        {isPasswordField ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={({ pressed }) => [styles.passwordToggle, pressed ? styles.pressed : null]}
          >
            <ThemedText style={styles.passwordToggleLabel} themeColor="primary">
              {isPasswordVisible ? 'Ocultar' : 'Mostrar'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <ThemedText
          accessibilityRole="alert"
          selectable
          style={[styles.error, { color: theme.danger }]}
        >
          {error}
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
    fontSize: TypeScale.label,
    fontWeight: '700',
  },
  required: {
    fontSize: TypeScale.caption,
  },
  inputShell: {
    minHeight: 52,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  input: {
    minHeight: 50,
    paddingHorizontal: Spacing.three,
    fontSize: TypeScale.body,
  },
  passwordInput: {
    paddingRight: 92,
  },
  passwordToggle: {
    position: 'absolute',
    right: 4,
    minWidth: 80,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.small,
  },
  passwordToggleLabel: {
    fontSize: TypeScale.caption,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.58,
  },
  error: {
    fontSize: TypeScale.caption,
    lineHeight: 18,
  },
});

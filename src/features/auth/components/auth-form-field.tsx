import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/shared/components/ui/app-icon';
import { getPressedScaleStyle } from '@/shared/components/ui/press-feedback';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { useTheme } from '@/theme/hooks/use-theme';
import { Spacing } from '@/theme/spacing';
import { Radius, TypeScale } from '@/theme/tokens';

type AuthFormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  helperText?: string;
  inputRef?: Ref<TextInput>;
};

export function AuthFormField({
  label,
  error,
  helperText,
  inputRef,
  onBlur,
  onFocus,
  secureTextEntry,
  ...inputProps
}: AuthFormFieldProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isToggleFocused, setIsToggleFocused] = useState(false);
  const isPasswordField = secureTextEntry === true;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.danger : isFocused ? theme.focus : theme.border,
            boxShadow: isFocused ? `0 0 0 2px ${theme.focus}` : undefined,
          },
        ]}
      >
        <TextInput
          accessibilityHint={error ?? helperText}
          accessibilityLabel={`${label}, obligatorio`}
          accessibilityState={{ disabled: inputProps.editable === false }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={theme.textSecondary}
          ref={inputRef}
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
            onBlur={() => setIsToggleFocused(false)}
            onFocus={() => setIsToggleFocused(true)}
            onPress={() => setIsPasswordVisible((current) => !current)}
            style={({ pressed }) => [
              styles.passwordToggle,
              isToggleFocused ? { boxShadow: `0 0 0 2px ${theme.focus}` } : null,
              pressed ? styles.pressed : null,
              getPressedScaleStyle(pressed, reduceMotion, 0.94),
            ]}
          >
            <AppIcon
              color={theme.textSecondary}
              name={
                isPasswordVisible
                  ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                  : { ios: 'eye', android: 'visibility', web: 'visibility' }
              }
              size={22}
            />
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
  label: {
    fontSize: TypeScale.label,
    fontWeight: '700',
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
    paddingRight: 58,
  },
  passwordToggle: {
    position: 'absolute',
    right: 2,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.small,
  },
  pressed: {
    opacity: 0.58,
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

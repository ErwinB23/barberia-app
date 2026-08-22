import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { ActionButton } from '@/shared/components/ui/action-button';
import { FormField } from '@/shared/components/ui/form-field';
import { ScreenHeading } from '@/shared/components/ui/screen-heading';
import { StatusMessage } from '@/shared/components/ui/status-message';
import { SurfaceCard } from '@/shared/components/ui/surface-card';
import { ThemedText } from '@/shared/components/ui/themed-text';
import { ThemedView } from '@/shared/components/ui/themed-view';
import { Spacing } from '@/theme/spacing';
import { Layout, TypeScale } from '@/theme/tokens';

import { sendBarbershopInvitation, sendInvitationEmail } from '../actions';
import { getInvitationErrorMessage } from '../errors';
import { useInvitationAdminAccess } from '../hooks/use-invitation-admin-access';
import {
  parseInvitationForm,
  type InvitationFormErrors,
  type InvitationFormValues,
} from '../invitation-domain';
import { InvitationChoiceField } from './invitation-choice-field';

const ROLE_CHOICES = [
  { value: 'barber', label: 'Barbero', description: 'Atenderá clientes dentro de esta barbería.' },
  {
    value: 'administrator',
    label: 'Administrador',
    description: 'Podrá gestionar únicamente esta barbería.',
  },
] as const;

const CHANNEL_CHOICES = [
  {
    value: 'app',
    label: 'En la app',
    description: 'Si la cuenta ya existe, recibirá también una notificación interna.',
  },
  {
    value: 'email',
    label: 'Por email',
    description: 'Registra una invitación que podrá aceptar al usar ese correo.',
  },
] as const;

export function NewInvitationScreen({ barbershopId }: { barbershopId: string | null }) {
  const { width } = useWindowDimensions();
  const { role, isLoading, error, reload } = useInvitationAdminAccess(barbershopId);
  const [values, setValues] = useState<InvitationFormValues>({
    email: '',
    role: 'barber',
    channel: 'app',
  });
  const [errors, setErrors] = useState<InvitationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingEmailInvitationId, setPendingEmailInvitationId] = useState<string | null>(null);

  const setField = (field: keyof InvitationFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMutationError(null);
    setFeedback(null);
    setPendingEmailInvitationId(null);
  };

  const deliverEmail = async (invitationId: string) => {
    try {
      await sendInvitationEmail(invitationId);
      setPendingEmailInvitationId(null);
      setMutationError(null);
      setFeedback('Invitación registrada y enviada por correo.');
    } catch (deliveryError) {
      setPendingEmailInvitationId(invitationId);
      setMutationError(getInvitationErrorMessage(deliveryError, 'email'));
      setFeedback('La invitación fue creada, pero el correo no pudo enviarse.');
    }
  };

  const submit = async () => {
    if (!barbershopId || role !== 'administrator') return;
    const parsed = parseInvitationForm(values);
    setErrors(parsed.errors);
    if (!parsed.values) return;

    setIsSubmitting(true);
    setMutationError(null);
    setFeedback(null);
    try {
      const invitationId = await sendBarbershopInvitation(barbershopId, parsed.values);
      setValues((current) => ({ ...current, email: '' }));
      if (parsed.values.channel === 'email') {
        await deliverEmail(invitationId);
      } else {
        setFeedback(
          'Invitación registrada. Si la cuenta ya existe, también aparecerá dentro de la app.',
        );
      }
    } catch (mutation) {
      setMutationError(getInvitationErrorMessage(mutation, 'send'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryEmail = async () => {
    if (!pendingEmailInvitationId) return;

    setIsSubmitting(true);
    setMutationError(null);
    try {
      await deliverEmail(pendingEmailInvitationId);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">Comprobando permisos…</ThemedText>
      </ThemedView>
    );
  }

  if (role !== 'administrator' || !barbershopId) {
    return (
      <ThemedView style={styles.centered}>
        <StatusMessage message={error ?? 'Solo un administrador puede enviar invitaciones.'} />
        <ActionButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={72}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            width < Layout.compactBreakpoint ? styles.compactContent : null,
          ]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeading
            description="El destinatario decidirá si acepta incorporarse a esta barbería."
            eyebrow="Personal"
            title="Nueva invitación"
          />
          <SurfaceCard style={styles.form}>
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={errors.email}
              keyboardType="email-address"
              label="Correo del destinatario"
              maxLength={320}
              onChangeText={(value) => setField('email', value)}
              required
              value={values.email}
            />
            <InvitationChoiceField
              choices={ROLE_CHOICES}
              error={errors.role}
              label="Rol ofrecido"
              onChange={(value) => setField('role', value)}
              value={values.role}
            />
            <InvitationChoiceField
              choices={CHANNEL_CHOICES}
              error={errors.channel}
              label="Canal"
              onChange={(value) => setField('channel', value)}
              value={values.channel}
            />
            {values.channel === 'email' ? (
              <StatusMessage message="Enviaremos un correo con instrucciones para aceptar o rechazar la invitación desde la app." />
            ) : null}
            <ThemedText style={styles.privacy} themeColor="textSecondary">
              Por seguridad, la aplicación no confirmará si el correo ya tiene una cuenta.
            </ThemedText>
            {feedback ? <StatusMessage message={feedback} tone="success" /> : null}
            {mutationError ? <StatusMessage message={mutationError} /> : null}
            {pendingEmailInvitationId ? (
              <ActionButton
                isLoading={isSubmitting}
                label="Reintentar envío por email"
                onPress={() => void retryEmail()}
                variant="secondary"
              />
            ) : null}
            <ActionButton
              isLoading={isSubmitting}
              label="Enviar invitación"
              onPress={() => void submit()}
            />
            <ActionButton
              disabled={isSubmitting}
              label="Ver invitaciones"
              onPress={() => router.back()}
              variant="secondary"
            />
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  content: {
    width: '100%',
    maxWidth: Layout.formMaxWidth,
    alignSelf: 'center',
    gap: Spacing.five,
    padding: Spacing.five,
    paddingVertical: Spacing.six,
  },
  compactContent: { gap: Spacing.four, padding: Spacing.three, paddingVertical: Spacing.four },
  form: { gap: Spacing.four, padding: Spacing.five },
  privacy: { fontSize: TypeScale.caption, lineHeight: 18 },
});

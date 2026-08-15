export const RECOVERY_REQUEST_SUCCESS_MESSAGE =
  'Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña.';

export const PASSWORD_RESET_SUCCESS_MESSAGE = 'Contraseña actualizada correctamente.';

export function getPasswordResetDestination(hasSession: boolean): '/' | '/login' {
  return hasSession ? '/' : '/login';
}

export function requiresEmailConfirmation(session: unknown) {
  return session === null;
}

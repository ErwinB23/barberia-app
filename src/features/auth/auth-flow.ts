export const RECOVERY_REQUEST_SUCCESS_MESSAGE =
  'Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña.';

export function requiresEmailConfirmation(session: unknown) {
  return session === null;
}

const FALLBACK_AUTH_ERROR = 'No pudimos completar la operación. Inténtalo nuevamente.';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed: 'Confirma tu correo electrónico antes de iniciar sesión.',
  email_address_invalid: 'El correo electrónico no es válido.',
  invalid_credentials: 'El correo o la contraseña no son correctos.',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Inténtalo más tarde.',
  over_request_rate_limit: 'Se realizaron demasiados intentos. Espera un momento.',
  signup_disabled: 'El registro no está disponible en este momento.',
  user_already_exists: 'Ya existe una cuenta asociada a este correo.',
  weak_password: 'La contraseña no cumple los requisitos de seguridad.',
};

export function getAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return FALLBACK_AUTH_ERROR;
  }

  const code = error.code;

  if (typeof code !== 'string') {
    return FALLBACK_AUTH_ERROR;
  }

  return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_AUTH_ERROR;
}

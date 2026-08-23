const FALLBACK_AUTH_ERROR = 'No pudimos completar la operación. Inténtalo nuevamente.';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed: 'Confirma tu correo electrónico antes de iniciar sesión.',
  email_address_invalid: 'El correo electrónico no es válido.',
  invalid_credentials: 'El correo o la contraseña no son correctos.',
  invalid_auth_callback: 'El enlace no es válido o ya no puede utilizarse.',
  oauth_browser_failed: 'No pudimos volver desde Google. Inténtalo nuevamente.',
  oauth_url_missing: 'Google no está disponible en este momento. Inténtalo más tarde.',
  provider_disabled: 'El acceso con Google aún no está habilitado.',
  auth_callback_error: 'No pudimos validar el enlace de autenticación.',
  otp_expired: 'El enlace ha vencido o ya fue utilizado. Solicita uno nuevo.',
  flow_state_expired: 'El enlace ha vencido. Solicita uno nuevo.',
  flow_state_not_found: 'El enlace no es válido o ya fue utilizado.',
  over_email_send_rate_limit:
    'Se solicitaron demasiados correos. Espera unos minutos antes de intentarlo nuevamente.',
  over_request_rate_limit: 'Se realizaron demasiados intentos. Espera un momento.',
  signup_disabled: 'El registro no está disponible en este momento.',
  session_not_found: 'La sesión del enlace no es válida. Solicita uno nuevo.',
  same_password: 'La nueva contraseña debe ser diferente de la actual.',
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

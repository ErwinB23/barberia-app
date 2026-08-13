type ErrorLike = { code?: unknown };

export function getFavoriteErrorMessage(error: unknown) {
  const code =
    error && typeof error === 'object' && typeof (error as ErrorLike).code === 'string'
      ? (error as ErrorLike).code
      : '';

  if (code === '23505') {
    return 'La barbería ya está en favoritas o la principal cambió desde otro dispositivo.';
  }

  return 'No pudimos actualizar tus favoritas. Revisa tu conexión e inténtalo nuevamente.';
}

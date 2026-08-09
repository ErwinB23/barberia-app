export type ServiceFormValues = {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
};

export type StyleFormValues = {
  name: string;
  description: string;
  imageUrl: string;
};

export type ParsedServiceForm = {
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
};

export type ParsedStyleForm = {
  name: string;
  description: string | null;
  imageUrl: string | null;
};

export type ServiceFormErrors = Partial<Record<keyof ServiceFormValues, string>>;
export type StyleFormErrors = Partial<Record<keyof StyleFormValues, string>>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRICE_PATTERN = /^\d{1,8}(?:[.,]\d{1,2})?$/;

export function isValidCatalogId(value: string) {
  return UUID_PATTERN.test(value);
}

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeOptionalText(value: string) {
  return collapseWhitespace(value) || null;
}

function validateName(name: string) {
  return name.length >= 2 && name.length <= 120;
}

function parsePrice(value: string) {
  const normalized = value.trim();
  if (!PRICE_PATTERN.test(normalized)) {
    return null;
  }

  const price = Number(normalized.replace(',', '.'));
  return Number.isFinite(price) && price >= 0 && price <= 99_999_999.99 ? price : null;
}

function parseDuration(value: string) {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const duration = Number(normalized);
  return Number.isSafeInteger(duration) && duration >= 1 && duration <= 480 ? duration : null;
}

export function isSafeImageUrl(value: string) {
  if (value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      !url.username &&
      !url.password &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

export function parseServiceForm(values: ServiceFormValues): {
  values: ParsedServiceForm | null;
  errors: ServiceFormErrors;
} {
  const name = collapseWhitespace(values.name);
  const description = normalizeOptionalText(values.description);
  const price = parsePrice(values.price);
  const durationMinutes = parseDuration(values.durationMinutes);
  const errors: ServiceFormErrors = {};

  if (!validateName(name)) {
    errors.name = 'El nombre debe tener entre 2 y 120 caracteres.';
  }
  if (description && description.length > 500) {
    errors.description = 'La descripción no puede superar 500 caracteres.';
  }
  if (price === null) {
    errors.price = 'Ingresa un precio entre S/ 0.00 y S/ 99,999,999.99, con hasta 2 decimales.';
  }
  if (durationMinutes === null) {
    errors.durationMinutes = 'La duración debe ser un número entero entre 1 y 480 minutos.';
  }

  if (Object.keys(errors).length > 0 || price === null || durationMinutes === null) {
    return { values: null, errors };
  }

  return {
    values: { name, description, price, durationMinutes },
    errors,
  };
}

export function parseStyleForm(values: StyleFormValues): {
  values: ParsedStyleForm | null;
  errors: StyleFormErrors;
} {
  const name = collapseWhitespace(values.name);
  const description = normalizeOptionalText(values.description);
  const imageUrl = values.imageUrl.trim() || null;
  const errors: StyleFormErrors = {};

  if (!validateName(name)) {
    errors.name = 'El nombre debe tener entre 2 y 120 caracteres.';
  }
  if (description && description.length > 500) {
    errors.description = 'La descripción no puede superar 500 caracteres.';
  }
  if (imageUrl && !isSafeImageUrl(imageUrl)) {
    errors.imageUrl = 'Ingresa una URL segura que empiece con http:// o https://.';
  }

  if (Object.keys(errors).length > 0) {
    return { values: null, errors };
  }

  return { values: { name, description, imageUrl }, errors };
}

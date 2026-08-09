import type { LateCancellationRefundPolicy } from './types.ts';

export type BarbershopFormValues = {
  name: string;
  description: string;
  phone: string;
  address: string;
  locationReference: string;
  logoUrl: string;
};

export type BarbershopSettingsFormValues = {
  minBookingNoticeMinutes: string;
  maxBookingDays: string;
  slotIntervalMinutes: string;
  appointmentBufferMinutes: string;
  cancellationNoticeMinutes: string;
  lateCancellationRefundPolicy: LateCancellationRefundPolicy;
};

export type YapeSettingsFormValues = {
  holderName: string;
  phone: string;
  qrUrl: string;
};

export type BarbershopFormErrors = Partial<Record<keyof BarbershopFormValues, string>>;
export type BarbershopSettingsFormErrors = Partial<
  Record<keyof BarbershopSettingsFormValues, string>
>;
export type YapeSettingsFormErrors = Partial<Record<keyof YapeSettingsFormValues, string>>;

export type NormalizedBarbershopForm = {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  locationReference?: string;
  logoUrl?: string;
};

export type ParsedBarbershopSettings = {
  minBookingNoticeMinutes: number;
  maxBookingDays: number;
  slotIntervalMinutes: number;
  appointmentBufferMinutes: number;
  cancellationNoticeMinutes: number;
  lateCancellationRefundPolicy: LateCancellationRefundPolicy;
};

const PHONE_PATTERN = /^\+?[0-9()\-\s]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeOptionalText(value: string) {
  const normalized = collapseWhitespace(value);
  return normalized || undefined;
}

function isValidPhone(value: string) {
  const digitCount = value.replace(/\D/g, '').length;
  return value.length >= 7 && value.length <= 30 && digitCount >= 7 && PHONE_PATTERN.test(value);
}

function isSafeWebUrl(value: string) {
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

export function normalizeBarbershopForm(values: BarbershopFormValues): NormalizedBarbershopForm {
  return {
    name: collapseWhitespace(values.name),
    description: normalizeOptionalText(values.description),
    phone: normalizeOptionalText(values.phone),
    address: normalizeOptionalText(values.address),
    locationReference: normalizeOptionalText(values.locationReference),
    logoUrl: normalizeOptionalText(values.logoUrl),
  };
}

export function validateBarbershopForm(values: BarbershopFormValues): BarbershopFormErrors {
  const errors: BarbershopFormErrors = {};
  const normalized = normalizeBarbershopForm(values);

  if (normalized.name.length < 2 || normalized.name.length > 120) {
    errors.name = 'El nombre debe tener entre 2 y 120 caracteres.';
  }
  if (normalized.description && normalized.description.length > 500) {
    errors.description = 'La descripción no puede superar 500 caracteres.';
  }
  if (normalized.phone && !isValidPhone(normalized.phone)) {
    errors.phone = 'Ingresa un teléfono válido de entre 7 y 30 caracteres.';
  }
  if (normalized.address && normalized.address.length > 250) {
    errors.address = 'La dirección no puede superar 250 caracteres.';
  }
  if (normalized.locationReference && normalized.locationReference.length > 250) {
    errors.locationReference = 'La referencia no puede superar 250 caracteres.';
  }
  if (normalized.logoUrl && !isSafeWebUrl(normalized.logoUrl)) {
    errors.logoUrl = 'Ingresa una URL segura que empiece con http:// o https://.';
  }

  return errors;
}

function parseIntegerInRange(
  value: string,
  min: number,
  max: number,
  errorMessage: string,
): { value?: number; error?: string } {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return { error: errorMessage };
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return { error: errorMessage };
  }

  return { value: parsed };
}

export function parseBarbershopSettingsForm(values: BarbershopSettingsFormValues): {
  values: ParsedBarbershopSettings | null;
  errors: BarbershopSettingsFormErrors;
} {
  const fields = {
    minBookingNoticeMinutes: parseIntegerInRange(
      values.minBookingNoticeMinutes,
      0,
      1440,
      'Debe ser un entero entre 0 y 1440 minutos.',
    ),
    maxBookingDays: parseIntegerInRange(
      values.maxBookingDays,
      1,
      365,
      'Debe ser un entero entre 1 y 365 días.',
    ),
    slotIntervalMinutes: parseIntegerInRange(
      values.slotIntervalMinutes,
      5,
      120,
      'Debe ser un entero entre 5 y 120 minutos.',
    ),
    appointmentBufferMinutes: parseIntegerInRange(
      values.appointmentBufferMinutes,
      0,
      240,
      'Debe ser un entero entre 0 y 240 minutos.',
    ),
    cancellationNoticeMinutes: parseIntegerInRange(
      values.cancellationNoticeMinutes,
      0,
      10080,
      'Debe ser un entero entre 0 y 10080 minutos.',
    ),
  };
  const errors: BarbershopSettingsFormErrors = {};

  for (const [key, result] of Object.entries(fields)) {
    if (result.error) {
      errors[key as keyof typeof fields] = result.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { values: null, errors };
  }

  return {
    values: {
      minBookingNoticeMinutes: fields.minBookingNoticeMinutes.value!,
      maxBookingDays: fields.maxBookingDays.value!,
      slotIntervalMinutes: fields.slotIntervalMinutes.value!,
      appointmentBufferMinutes: fields.appointmentBufferMinutes.value!,
      cancellationNoticeMinutes: fields.cancellationNoticeMinutes.value!,
      lateCancellationRefundPolicy: values.lateCancellationRefundPolicy,
    },
    errors,
  };
}

export function normalizeYapeSettingsForm(values: YapeSettingsFormValues) {
  return {
    holderName: normalizeOptionalText(values.holderName),
    phone: normalizeOptionalText(values.phone),
    qrUrl: normalizeOptionalText(values.qrUrl),
  };
}

export function validateYapeSettingsForm(values: YapeSettingsFormValues): YapeSettingsFormErrors {
  const errors: YapeSettingsFormErrors = {};
  const normalized = normalizeYapeSettingsForm(values);

  if (
    normalized.holderName &&
    (normalized.holderName.length < 2 || normalized.holderName.length > 120)
  ) {
    errors.holderName = 'El titular debe tener entre 2 y 120 caracteres.';
  }
  if (normalized.phone && !isValidPhone(normalized.phone)) {
    errors.phone = 'Ingresa un teléfono válido de entre 7 y 30 caracteres.';
  }
  if (normalized.qrUrl && !isSafeWebUrl(normalized.qrUrl)) {
    errors.qrUrl = 'Ingresa una URL segura que empiece con http:// o https://.';
  }

  return errors;
}

const PHONE_PATTERN = /^\+?[0-9()\-\s]+$/;

function normalizeRegistrationPhone(value: string) {
  const phone = value.trim().replace(/\s+/g, ' ');
  const digitCount = phone.replace(/\D/g, '').length;

  if (phone.length < 7 || phone.length > 30 || digitCount < 7 || !PHONE_PATTERN.test(phone)) {
    return null;
  }

  return phone;
}

export function getRegistrationPhone(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || !('phone' in metadata)) {
    return null;
  }

  const phone = metadata.phone;

  return typeof phone === 'string' ? normalizeRegistrationPhone(phone) : null;
}

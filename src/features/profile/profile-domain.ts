export type ProfileFormValues = {
  fullName: string;
  phone: string;
  avatarUrl: string;
};

export type ParsedProfileFormValues = {
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
};

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>;

export type ProfileSpaceSource = {
  barbershopId: string;
  barbershopName: string;
  role: 'administrator' | 'barber';
  ownBarberProfile: { barberId: string; isActive: boolean } | null;
};

export type ProfileSpace = {
  id: string;
  kind: 'administrator' | 'barber';
  title: string;
  description: string;
  href: string;
};

const PHONE_PATTERN = /^\+?[0-9()\-\s]+$/;

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function isSafeProfileImageUrl(value: string | null) {
  if (!value) return false;

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseProfileForm(values: ProfileFormValues): {
  values: ParsedProfileFormValues | null;
  errors: ProfileFormErrors;
} {
  const fullName = collapseWhitespace(values.fullName);
  const phone = collapseWhitespace(values.phone) || null;
  const avatarUrl = values.avatarUrl.trim() || null;
  const errors: ProfileFormErrors = {};

  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = 'El nombre debe tener entre 2 y 120 caracteres.';
  }

  if (phone) {
    const digitCount = phone.replace(/\D/g, '').length;
    if (phone.length < 7 || phone.length > 30 || digitCount < 7 || !PHONE_PATTERN.test(phone)) {
      errors.phone = 'Ingresa un teléfono válido de entre 7 y 30 caracteres.';
    }
  }

  if (avatarUrl && !isSafeProfileImageUrl(avatarUrl)) {
    errors.avatarUrl = 'Ingresa una URL HTTPS válida.';
  }

  return Object.keys(errors).length > 0
    ? { values: null, errors }
    : { values: { fullName, phone, avatarUrl }, errors };
}

export function buildProfileSpaces(sources: readonly ProfileSpaceSource[]): ProfileSpace[] {
  const barberSpaces = sources.flatMap<ProfileSpace>((source) => {
    if (!source.ownBarberProfile?.isActive) return [];

    return [
      {
        id: `barber:${source.ownBarberProfile.barberId}`,
        kind: 'barber',
        title: 'Mi espacio de barbero',
        description: source.barbershopName,
        href: `/barbershops/${source.barbershopId}/barbers/${source.ownBarberProfile.barberId}`,
      },
    ];
  });

  const administratorSpaces = sources.flatMap<ProfileSpace>((source) =>
    source.role === 'administrator'
      ? [
          {
            id: `administrator:${source.barbershopId}`,
            kind: 'administrator',
            title: `Administrar ${source.barbershopName}`,
            description: 'Panel administrativo',
            href: `/barbershops/${source.barbershopId}`,
          },
        ]
      : [],
  );

  return [...barberSpaces, ...administratorSpaces];
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TimeInterval = {
  id?: string;
  startTime: string;
  endTime: string;
};

export type BarberScheduleFormValues = {
  startTime: string;
  endTime: string;
};

export type BlockFormValues = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  reason: string;
};

export type ParsedBlockForm = {
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export type BarberProfileFormValues = {
  displayName: string;
  bio: string;
  photoUrl: string;
};

export type ParsedBarberProfileForm = {
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
};

export type BarberScheduleFormErrors = Partial<Record<keyof BarberScheduleFormValues, string>>;
export type BlockFormErrors = Partial<Record<keyof BlockFormValues, string>>;
export type BarberProfileFormErrors = Partial<Record<keyof BarberProfileFormValues, string>>;

export const WEEKDAYS_MONDAY_FIRST: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getWeekdayName(weekday: Weekday) {
  return WEEKDAY_NAMES[weekday];
}

function timeToMinutes(value: string) {
  const match = TIME_PATTERN.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function isTimeRangeValid(startTime: string, endTime: string) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return start !== null && end !== null && start < end;
}

export function hasOverlappingIntervals(
  candidate: Pick<TimeInterval, 'startTime' | 'endTime'>,
  intervals: readonly TimeInterval[],
  excludedId?: string,
) {
  const start = timeToMinutes(candidate.startTime);
  const end = timeToMinutes(candidate.endTime);
  if (start === null || end === null) {
    return false;
  }

  return intervals.some((interval) => {
    if (excludedId && interval.id === excludedId) {
      return false;
    }
    const existingStart = timeToMinutes(interval.startTime);
    const existingEnd = timeToMinutes(interval.endTime);
    return (
      existingStart !== null && existingEnd !== null && start < existingEnd && end > existingStart
    );
  });
}

export function sortTimeIntervals<T extends TimeInterval>(intervals: readonly T[]) {
  return [...intervals].sort(
    (left, right) =>
      left.startTime.localeCompare(right.startTime) || left.endTime.localeCompare(right.endTime),
  );
}

export function isScheduleWithinBarbershopHours(
  candidate: Pick<TimeInterval, 'startTime' | 'endTime'>,
  openingHours: readonly Pick<TimeInterval, 'startTime' | 'endTime'>[],
) {
  const start = timeToMinutes(candidate.startTime);
  const end = timeToMinutes(candidate.endTime);
  if (start === null || end === null) {
    return false;
  }

  return openingHours.some((opening) => {
    const openingStart = timeToMinutes(opening.startTime);
    const openingEnd = timeToMinutes(opening.endTime);
    return (
      openingStart !== null && openingEnd !== null && start >= openingStart && end <= openingEnd
    );
  });
}

export function parseBarberScheduleForm(
  values: BarberScheduleFormValues,
  existingIntervals: readonly TimeInterval[],
  openingHours: readonly Pick<TimeInterval, 'startTime' | 'endTime'>[],
  excludedId?: string,
): { values: BarberScheduleFormValues | null; errors: BarberScheduleFormErrors } {
  const startTime = values.startTime.trim();
  const endTime = values.endTime.trim();
  const errors: BarberScheduleFormErrors = {};

  if (timeToMinutes(startTime) === null) {
    errors.startTime = 'Ingresa una hora válida con formato HH:mm.';
  }
  if (timeToMinutes(endTime) === null) {
    errors.endTime = 'Ingresa una hora válida con formato HH:mm.';
  }

  if (Object.keys(errors).length === 0 && !isTimeRangeValid(startTime, endTime)) {
    errors.endTime = 'La hora de fin debe ser posterior al inicio.';
  } else if (
    Object.keys(errors).length === 0 &&
    hasOverlappingIntervals({ startTime, endTime }, existingIntervals, excludedId)
  ) {
    errors.endTime = 'Este intervalo se superpone con otro horario del barbero.';
  } else if (
    Object.keys(errors).length === 0 &&
    !isScheduleWithinBarbershopHours({ startTime, endTime }, openingHours)
  ) {
    errors.endTime = 'El intervalo debe estar dentro de un horario general disponible.';
  }

  return Object.keys(errors).length > 0
    ? { values: null, errors }
    : { values: { startTime, endTime }, errors };
}

export function getSelectedServiceIds(assignments: readonly { serviceId: string }[]) {
  return [...new Set(assignments.map((assignment) => assignment.serviceId))].sort();
}

function isValidDate(value: string) {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function toLimaIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-05:00`).toISOString();
}

export function parseBlockForm(values: BlockFormValues): {
  values: ParsedBlockForm | null;
  errors: BlockFormErrors;
} {
  const startDate = values.startDate.trim();
  const startTime = values.startTime.trim();
  const endDate = values.endDate.trim();
  const endTime = values.endTime.trim();
  const reason = values.reason.trim().replace(/\s+/g, ' ') || null;
  const errors: BlockFormErrors = {};

  if (!isValidDate(startDate))
    errors.startDate = 'Ingresa una fecha válida con formato AAAA-MM-DD.';
  if (timeToMinutes(startTime) === null)
    errors.startTime = 'Ingresa una hora válida con formato HH:mm.';
  if (!isValidDate(endDate)) errors.endDate = 'Ingresa una fecha válida con formato AAAA-MM-DD.';
  if (timeToMinutes(endTime) === null)
    errors.endTime = 'Ingresa una hora válida con formato HH:mm.';
  if (reason && reason.length > 250) errors.reason = 'El motivo no puede superar 250 caracteres.';

  if (Object.keys(errors).length > 0) return { values: null, errors };

  const startsAt = toLimaIso(startDate, startTime);
  const endsAt = toLimaIso(endDate, endTime);
  if (startsAt >= endsAt) {
    errors.endTime = 'El bloqueo debe terminar después de comenzar.';
    return { values: null, errors };
  }

  return { values: { startsAt, endsAt, reason }, errors };
}

export function isSafeRemoteImageUrl(value: string | null) {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseBarberProfileForm(values: BarberProfileFormValues): {
  values: ParsedBarberProfileForm | null;
  errors: BarberProfileFormErrors;
} {
  const displayName = values.displayName.trim().replace(/\s+/g, ' ');
  const bio = values.bio.trim() || null;
  const photoUrl = values.photoUrl.trim() || null;
  const errors: BarberProfileFormErrors = {};

  if (displayName.length < 2 || displayName.length > 120) {
    errors.displayName = 'El nombre debe tener entre 2 y 120 caracteres.';
  }
  if (bio && bio.length > 500) {
    errors.bio = 'La biografía no puede superar 500 caracteres.';
  }
  if (photoUrl && !isSafeRemoteImageUrl(photoUrl)) {
    errors.photoUrl = 'Ingresa una URL HTTPS válida.';
  }

  return Object.keys(errors).length > 0
    ? { values: null, errors }
    : { values: { displayName, bio, photoUrl }, errors };
}

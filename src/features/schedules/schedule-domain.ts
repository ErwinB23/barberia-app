export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TimeInterval = {
  id?: string;
  startTime: string;
  endTime: string;
};

export type HourFormValues = {
  startTime: string;
  endTime: string;
};

export type ClosureFormValues = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  reason: string;
};

export type ParsedClosureForm = {
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export type HourFormErrors = Partial<Record<keyof HourFormValues, string>>;
export type ClosureFormErrors = Partial<Record<keyof ClosureFormValues, string>>;

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
  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
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
  const candidateStart = timeToMinutes(candidate.startTime);
  const candidateEnd = timeToMinutes(candidate.endTime);
  if (candidateStart === null || candidateEnd === null) {
    return false;
  }

  return intervals.some((interval) => {
    if (excludedId && interval.id === excludedId) {
      return false;
    }

    const intervalStart = timeToMinutes(interval.startTime);
    const intervalEnd = timeToMinutes(interval.endTime);
    return (
      intervalStart !== null &&
      intervalEnd !== null &&
      candidateStart < intervalEnd &&
      candidateEnd > intervalStart
    );
  });
}

export function sortHourIntervals<T extends TimeInterval>(intervals: readonly T[]) {
  return [...intervals].sort(
    (left, right) =>
      left.startTime.localeCompare(right.startTime) || left.endTime.localeCompare(right.endTime),
  );
}

export function parseHourForm(
  values: HourFormValues,
  existingIntervals: readonly TimeInterval[],
  excludedId?: string,
): { values: HourFormValues | null; errors: HourFormErrors } {
  const startTime = values.startTime.trim();
  const endTime = values.endTime.trim();
  const errors: HourFormErrors = {};

  if (timeToMinutes(startTime) === null) {
    errors.startTime = 'Ingresa una hora válida con formato HH:mm.';
  }
  if (timeToMinutes(endTime) === null) {
    errors.endTime = 'Ingresa una hora válida con formato HH:mm.';
  }

  if (Object.keys(errors).length === 0 && !isTimeRangeValid(startTime, endTime)) {
    errors.endTime = 'La hora de fin debe ser posterior a la hora de inicio.';
  } else if (
    Object.keys(errors).length === 0 &&
    hasOverlappingIntervals({ startTime, endTime }, existingIntervals, excludedId)
  ) {
    errors.endTime = 'Este intervalo se superpone con otro horario del mismo día.';
  }

  return Object.keys(errors).length > 0
    ? { values: null, errors }
    : { values: { startTime, endTime }, errors };
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

export function parseClosureForm(values: ClosureFormValues): {
  values: ParsedClosureForm | null;
  errors: ClosureFormErrors;
} {
  const startDate = values.startDate.trim();
  const startTime = values.startTime.trim();
  const endDate = values.endDate.trim();
  const endTime = values.endTime.trim();
  const reason = values.reason.trim().replace(/\s+/g, ' ') || null;
  const errors: ClosureFormErrors = {};

  if (!isValidDate(startDate)) {
    errors.startDate = 'Ingresa una fecha válida con formato AAAA-MM-DD.';
  }
  if (timeToMinutes(startTime) === null) {
    errors.startTime = 'Ingresa una hora válida con formato HH:mm.';
  }
  if (!isValidDate(endDate)) {
    errors.endDate = 'Ingresa una fecha válida con formato AAAA-MM-DD.';
  }
  if (timeToMinutes(endTime) === null) {
    errors.endTime = 'Ingresa una hora válida con formato HH:mm.';
  }
  if (reason && reason.length > 250) {
    errors.reason = 'El motivo no puede superar 250 caracteres.';
  }

  if (Object.keys(errors).length > 0) {
    return { values: null, errors };
  }

  const startsAt = toLimaIso(startDate, startTime);
  const endsAt = toLimaIso(endDate, endTime);
  if (startsAt >= endsAt) {
    errors.endTime = 'El cierre debe terminar después de comenzar.';
    return { values: null, errors };
  }

  return { values: { startsAt, endsAt, reason }, errors };
}

import type { BarbershopStatus } from './types';

export type PublicationRequirementKey =
  'basicData' | 'openingHours' | 'activeService' | 'activeBarber' | 'scheduledActiveBarber';

export type PublicationReadinessInput = {
  phone: string | null;
  address: string | null;
  hasOpeningHours: boolean;
  hasActiveService: boolean;
  hasActiveBarber: boolean;
  hasScheduledActiveBarber: boolean;
};

export type PublicationRequirement = {
  key: PublicationRequirementKey;
  label: string;
  isComplete: boolean;
};

const STATUS_COPY: Record<BarbershopStatus, { label: string; description: string }> = {
  published: {
    label: 'Publicada',
    description: 'Visible y disponible para nuevas reservas.',
  },
  paused: {
    label: 'Pausada',
    description: 'Visible, pero temporalmente no acepta nuevas reservas.',
  },
  unpublished: {
    label: 'No publicada',
    description: 'No es visible para los clientes.',
  },
};

export function buildPublicationReadiness(
  input: PublicationReadinessInput,
): PublicationRequirement[] {
  const hasBasicData = (input.phone?.trim().length ?? 0) >= 7 && Boolean(input.address?.trim());

  return [
    { key: 'basicData', label: 'Datos básicos requeridos', isComplete: hasBasicData },
    {
      key: 'openingHours',
      label: 'Horario general configurado',
      isComplete: input.hasOpeningHours,
    },
    {
      key: 'activeService',
      label: 'Al menos un servicio activo',
      isComplete: input.hasActiveService,
    },
    {
      key: 'activeBarber',
      label: 'Al menos un barbero activo',
      isComplete: input.hasActiveBarber,
    },
    {
      key: 'scheduledActiveBarber',
      label: 'Al menos un barbero activo con horario individual',
      isComplete: input.hasScheduledActiveBarber,
    },
  ];
}

export function canPublishBarbershop(readiness: readonly PublicationRequirement[]) {
  return readiness.length > 0 && readiness.every((requirement) => requirement.isComplete);
}

export function getPublicationRequirementRoute(
  key: PublicationRequirementKey,
  barbershopId: string,
) {
  if (key === 'basicData') return `/barbershops/${barbershopId}/edit`;
  if (key === 'openingHours') return `/barbershops/${barbershopId}/schedules`;
  if (key === 'activeService') return `/barbershops/${barbershopId}/services`;
  return `/barbershops/${barbershopId}/barbers`;
}

export function getPublicationStatusCopy(status: BarbershopStatus) {
  return STATUS_COPY[status];
}

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

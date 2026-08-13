import { useLocalSearchParams } from 'expo-router';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useInvitationRouteParams() {
  const { barbershopId } = useLocalSearchParams<{ barbershopId?: string }>();
  return {
    barbershopId:
      typeof barbershopId === 'string' && UUID_PATTERN.test(barbershopId) ? barbershopId : null,
  };
}

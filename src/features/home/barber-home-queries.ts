import { getUnreadNotificationCount } from '@/features/notifications/queries';
import { getOperationalAgenda } from '@/features/reservations/queries';
import { supabase } from '@/infrastructure/supabase/client';

import { loadBarberHomeData } from './barber-home-domain';

async function getBarbershopName(barbershopId: string) {
  const { data, error } = await supabase
    .from('barbershops')
    .select('name')
    .eq('id', barbershopId)
    .maybeSingle();

  if (error) throw error;
  return data?.name ?? null;
}

export async function getBarberHomeData(input: {
  userId: string;
  barbershopId: string;
  barberId: string;
}) {
  return loadBarberHomeData(
    {
      getAgenda: () =>
        getOperationalAgenda({
          userId: input.userId,
          barbershopId: input.barbershopId,
          barberId: input.barberId,
          period: 'today',
        }),
      getBarbershopName: () => getBarbershopName(input.barbershopId),
      getUnreadNotificationCount: () => getUnreadNotificationCount(input.userId),
    },
    input.barbershopId,
  );
}

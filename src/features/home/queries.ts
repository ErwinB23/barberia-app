import { getPublicBarbershops } from '@/features/booking/queries';
import { getFavoriteBarbershops } from '@/features/favorites/queries';
import { getUnreadNotificationCount } from '@/features/notifications/queries';
import { getClientReservations } from '@/features/reservations/queries';

import { loadClientHomeData } from './client-home-domain';
import type { ClientHomeData } from './types';

export async function getClientHomeData(userId: string): Promise<ClientHomeData> {
  return loadClientHomeData({
    getReservations: () => getClientReservations(userId),
    getBarbershops: getPublicBarbershops,
    getFavorites: () => getFavoriteBarbershops(userId),
    getUnreadNotificationCount: () => getUnreadNotificationCount(userId),
  });
}

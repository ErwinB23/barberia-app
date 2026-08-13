import { supabase } from '@/infrastructure/supabase/client';

import { sortFavorites } from './favorites-domain';
import type { FavoriteBarbershop, FavoriteStatus } from './types';

export async function getFavoriteBarbershops(userId: string): Promise<FavoriteBarbershop[]> {
  const { data, error } = await supabase
    .from('favorite_barbershops')
    .select(
      `
        id,
        barbershop_id,
        is_primary,
        created_at,
        barbershop:barbershops!favorite_barbershops_barbershop_id_fkey (
          id,
          name,
          description,
          logo_url,
          address,
          status
        )
      `,
    )
    .eq('user_id', userId);

  if (error) throw error;

  return sortFavorites(
    data.map((favorite) => ({
      id: favorite.id,
      barbershopId: favorite.barbershop_id,
      isPrimary: favorite.is_primary,
      createdAt: favorite.created_at,
      barbershop: favorite.barbershop
        ? {
            id: favorite.barbershop.id,
            name: favorite.barbershop.name,
            description: favorite.barbershop.description,
            logoUrl: favorite.barbershop.logo_url,
            address: favorite.barbershop.address,
            status: favorite.barbershop.status,
          }
        : null,
    })),
  );
}

export async function getFavoriteStatus(
  userId: string,
  barbershopId: string,
): Promise<FavoriteStatus | null> {
  const { data, error } = await supabase
    .from('favorite_barbershops')
    .select('id, is_primary')
    .eq('user_id', userId)
    .eq('barbershop_id', barbershopId)
    .maybeSingle();

  if (error) throw error;
  return data ? { id: data.id, isPrimary: data.is_primary } : null;
}

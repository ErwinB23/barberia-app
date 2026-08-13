import { supabase } from '@/infrastructure/supabase/client';

import { getPrimaryFavoriteChanges } from './favorites-domain';
import { getFavoriteBarbershops } from './queries';

export async function addFavorite(userId: string, barbershopId: string) {
  const { error } = await supabase.from('favorite_barbershops').insert({
    user_id: userId,
    barbershop_id: barbershopId,
    is_primary: false,
  });
  if (error) throw error;
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const { error } = await supabase
    .from('favorite_barbershops')
    .delete()
    .eq('id', favoriteId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function changePrimaryFavorite(userId: string, targetFavoriteId: string | null) {
  const favorites = await getFavoriteBarbershops(userId);
  const changes = getPrimaryFavoriteChanges(favorites, targetFavoriteId);

  for (const change of changes) {
    const { data, error } = await supabase
      .from('favorite_barbershops')
      .update({ is_primary: change.isPrimary })
      .eq('id', change.id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Favorite not found');
  }
}

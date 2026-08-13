type FavoriteLike = {
  id: string;
  isPrimary: boolean;
  barbershop: { name: string } | null;
};

export function getFavoriteState(favorites: readonly FavoriteLike[], favoriteId: string) {
  const favorite = favorites.find((item) => item.id === favoriteId);
  return {
    isFavorite: Boolean(favorite),
    isPrimary: favorite?.isPrimary ?? false,
  };
}

export function getPrimaryFavoriteChanges(
  favorites: readonly FavoriteLike[],
  targetFavoriteId: string | null,
) {
  const changes: { id: string; isPrimary: boolean }[] = [];
  const currentPrimary = favorites.find((favorite) => favorite.isPrimary);

  if (currentPrimary && currentPrimary.id !== targetFavoriteId) {
    changes.push({ id: currentPrimary.id, isPrimary: false });
  }
  if (targetFavoriteId && currentPrimary?.id !== targetFavoriteId) {
    changes.push({ id: targetFavoriteId, isPrimary: true });
  }

  return changes;
}

export function sortFavorites<T extends FavoriteLike>(favorites: readonly T[]): T[] {
  return [...favorites].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    const leftName = left.barbershop?.name ?? '\uffff';
    const rightName = right.barbershop?.name ?? '\uffff';
    return leftName.localeCompare(rightName, 'es');
  });
}

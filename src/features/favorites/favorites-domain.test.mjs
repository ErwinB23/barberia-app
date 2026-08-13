import assert from 'node:assert/strict';
import test from 'node:test';

const domain = await import('./favorites-domain.ts').catch(() => ({}));

const favorites = [
  { id: 'favorite-a', isPrimary: true, barbershop: { name: 'Zulu' } },
  { id: 'favorite-b', isPrimary: false, barbershop: { name: 'Alfa' } },
  { id: 'favorite-c', isPrimary: false, barbershop: null },
];

test('identifica si una barbería es favorita y principal', () => {
  assert.equal(typeof domain.getFavoriteState, 'function');
  if (typeof domain.getFavoriteState !== 'function') return;

  assert.deepEqual(domain.getFavoriteState(favorites, 'favorite-a'), {
    isFavorite: true,
    isPrimary: true,
  });
  assert.deepEqual(domain.getFavoriteState(favorites, 'missing'), {
    isFavorite: false,
    isPrimary: false,
  });
});

test('planifica una sola favorita principal y permite dejar de tener principal', () => {
  assert.equal(typeof domain.getPrimaryFavoriteChanges, 'function');
  if (typeof domain.getPrimaryFavoriteChanges !== 'function') return;

  assert.deepEqual(domain.getPrimaryFavoriteChanges(favorites, 'favorite-b'), [
    { id: 'favorite-a', isPrimary: false },
    { id: 'favorite-b', isPrimary: true },
  ]);
  assert.deepEqual(domain.getPrimaryFavoriteChanges(favorites, null), [
    { id: 'favorite-a', isPrimary: false },
  ]);
});

test('ordena primero la principal y luego por nombre visible', () => {
  assert.equal(typeof domain.sortFavorites, 'function');
  if (typeof domain.sortFavorites !== 'function') return;

  assert.deepEqual(
    domain.sortFavorites(favorites).map((favorite) => favorite.id),
    ['favorite-a', 'favorite-b', 'favorite-c'],
  );
});

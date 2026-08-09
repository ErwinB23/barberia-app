export function formatPen(price: number) {
  return `S/ ${price.toFixed(2)}`;
}

export function formatDuration(durationMinutes: number) {
  return `${durationMinutes} min`;
}

export function getCatalogStatusLabel(isActive: boolean) {
  return isActive ? 'Activo' : 'Inactivo';
}

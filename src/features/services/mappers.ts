import type { CatalogService, CatalogStyle, ServiceRow, StyleRow } from './types.ts';

export function mapService(row: ServiceRow): CatalogService {
  return {
    id: row.id,
    barbershopId: row.barbershop_id,
    name: row.name,
    description: row.description,
    price: row.price,
    durationMinutes: row.duration_minutes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapStyle(row: StyleRow): CatalogStyle {
  return {
    id: row.id,
    serviceId: row.service_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

import type { Enums, Tables } from '../../infrastructure/supabase/database.types.ts';

export type MembershipRole = Enums<'membership_role'>;

export type ServiceRow = Pick<
  Tables<'services'>,
  | 'id'
  | 'barbershop_id'
  | 'name'
  | 'description'
  | 'price'
  | 'duration_minutes'
  | 'is_active'
  | 'created_at'
  | 'updated_at'
>;

export type StyleRow = Pick<
  Tables<'styles'>,
  | 'id'
  | 'service_id'
  | 'name'
  | 'description'
  | 'image_url'
  | 'is_active'
  | 'created_at'
  | 'updated_at'
>;

export type CatalogService = {
  id: string;
  barbershopId: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogStyle = {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

import type { Database } from '@/infrastructure/supabase/database.types';

export type FavoriteBarbershop = {
  id: string;
  barbershopId: string;
  isPrimary: boolean;
  createdAt: string;
  barbershop: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    address: string | null;
    status: Database['public']['Enums']['barbershop_status'];
  } | null;
};

export type FavoriteStatus = {
  id: string;
  isPrimary: boolean;
};

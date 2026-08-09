import type { Enums, Tables } from '../../infrastructure/supabase/database.types.ts';

export type BarbershopStatus = Enums<'barbershop_status'>;
export type MembershipRole = Enums<'membership_role'>;
export type LateCancellationRefundPolicy = Enums<'late_cancellation_refund_policy'>;

export type BarbershopSummary = Pick<
  Tables<'barbershops'>,
  | 'id'
  | 'name'
  | 'status'
  | 'phone'
  | 'address'
  | 'description'
  | 'location_reference'
  | 'logo_url'
  | 'created_at'
  | 'updated_at'
>;

export type MembershipQueryRow = {
  id: string;
  role: MembershipRole;
  barbershop: BarbershopSummary | null;
};

export type UserBarbershop = {
  membershipId: string;
  role: MembershipRole;
  barbershop: {
    id: string;
    name: string;
    status: BarbershopStatus;
    phone: string | null;
    address: string | null;
    description: string | null;
    locationReference: string | null;
    logoUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type BarbershopSettings = Tables<'barbershop_settings'>;

export type YapeSettings = Pick<
  Tables<'barbershop_payment_settings'>,
  'barbershop_id' | 'yape_holder_name' | 'yape_phone' | 'yape_qr_url' | 'updated_at'
>;

export type BarbershopDetail = UserBarbershop & {
  settings: BarbershopSettings | null;
};

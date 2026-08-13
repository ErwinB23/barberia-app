import type { Database } from '@/infrastructure/supabase/database.types';

export type ReservationStatus = Database['public']['Enums']['reservation_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type RefundPolicy = Database['public']['Enums']['late_cancellation_refund_policy'];

export type ClientReservationItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  styleId: string | null;
  styleName: string | null;
  priceAtBooking: number;
  durationAtBooking: number;
};

export type ClientReservationPayment = {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  confirmedAt: string | null;
  refundedAt: string | null;
};

export type ClientReservation = {
  id: string;
  barbershopId: string;
  barbershopName: string;
  barberId: string;
  barberName: string;
  startsAt: string;
  endsAt: string;
  status: ReservationStatus;
  totalPrice: number;
  totalDurationMinutes: number;
  rescheduleCount: number;
  isLateReschedule: boolean;
  isLateCancellation: boolean;
  isRefundEligible: boolean;
  refundPolicy: RefundPolicy | null;
  cancelledAt: string | null;
  items: ClientReservationItem[];
  payment: ClientReservationPayment | null;
};

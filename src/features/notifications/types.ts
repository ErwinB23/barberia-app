export type UserNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  barbershopId: string | null;
  reservationId: string | null;
  paymentId: string | null;
  invitationId: string | null;
  href: string | null;
};

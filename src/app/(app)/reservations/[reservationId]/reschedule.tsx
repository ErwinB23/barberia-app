import { useBookingRouteParams } from '@/features/booking/hooks/use-booking-route-params';
import { RescheduleReservationScreen } from '@/features/reservations/components/reschedule-reservation-screen';

export default function RescheduleReservationRoute() {
  const { reservationId } = useBookingRouteParams();
  return <RescheduleReservationScreen reservationId={reservationId} />;
}

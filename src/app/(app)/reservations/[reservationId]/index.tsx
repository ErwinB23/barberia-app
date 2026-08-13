import { useBookingRouteParams } from '@/features/booking/hooks/use-booking-route-params';
import { ReservationDetailScreen } from '@/features/reservations/components/reservation-detail-screen';

export default function ReservationDetailRoute() {
  const { reservationId, created } = useBookingRouteParams();
  return <ReservationDetailScreen created={created} reservationId={reservationId} />;
}

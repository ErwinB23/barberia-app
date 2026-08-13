import { BookingScreen } from '@/features/booking/components/booking-screen';
import { useBookingRouteParams } from '@/features/booking/hooks/use-booking-route-params';

export default function BookingRoute() {
  const { barbershopId } = useBookingRouteParams();
  return <BookingScreen barbershopId={barbershopId} />;
}

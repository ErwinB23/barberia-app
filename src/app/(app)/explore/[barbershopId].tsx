import { PublicBarbershopDetailScreen } from '@/features/booking/components/public-barbershop-detail-screen';
import { useBookingRouteParams } from '@/features/booking/hooks/use-booking-route-params';

export default function PublicBarbershopRoute() {
  const { barbershopId } = useBookingRouteParams();
  return <PublicBarbershopDetailScreen barbershopId={barbershopId} />;
}

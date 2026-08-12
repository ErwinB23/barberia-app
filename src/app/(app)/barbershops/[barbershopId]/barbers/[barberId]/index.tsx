import { BarberDetailScreen } from '@/features/barbers/components/barber-detail-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function BarberDetailRoute() {
  const { barbershopId, barberId } = useBarberRouteParams();
  return <BarberDetailScreen barberId={barberId} barbershopId={barbershopId} />;
}

import { BarberHomeScreen } from '@/features/home/components/barber-home-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function BarberHomeRoute() {
  const { barbershopId, barberId } = useBarberRouteParams();
  return <BarberHomeScreen barberId={barberId} barbershopId={barbershopId} />;
}

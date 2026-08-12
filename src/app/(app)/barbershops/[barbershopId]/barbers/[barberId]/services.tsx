import { BarberServicesScreen } from '@/features/barbers/components/barber-services-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function BarberServicesRoute() {
  const { barbershopId, barberId } = useBarberRouteParams();
  return <BarberServicesScreen barberId={barberId} barbershopId={barbershopId} />;
}

import { BarberBlocksScreen } from '@/features/barbers/components/barber-blocks-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function BarberBlocksRoute() {
  const { barbershopId, barberId, saved } = useBarberRouteParams();
  return <BarberBlocksScreen barberId={barberId} barbershopId={barbershopId} saved={saved} />;
}

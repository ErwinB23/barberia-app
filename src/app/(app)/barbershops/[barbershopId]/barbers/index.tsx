import { BarbersScreen } from '@/features/barbers/components/barbers-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function BarbersRoute() {
  const { barbershopId } = useBarberRouteParams();
  return <BarbersScreen barbershopId={barbershopId} />;
}

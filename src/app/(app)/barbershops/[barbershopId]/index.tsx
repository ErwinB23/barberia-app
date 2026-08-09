import { BarbershopDetailScreen } from '@/features/barbershops/components/barbershop-detail-screen';
import { useBarbershopRouteId } from '@/features/barbershops/hooks/use-barbershop-route-id';

export default function BarbershopDetailRoute() {
  const barbershopId = useBarbershopRouteId();

  return <BarbershopDetailScreen barbershopId={barbershopId} />;
}

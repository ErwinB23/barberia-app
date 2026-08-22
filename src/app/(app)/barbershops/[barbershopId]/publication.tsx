import { BarbershopPublicationScreen } from '@/features/barbershops/components/barbershop-publication-screen';
import { useBarbershopRouteId } from '@/features/barbershops/hooks/use-barbershop-route-id';

export default function BarbershopPublicationRoute() {
  const barbershopId = useBarbershopRouteId();
  return <BarbershopPublicationScreen barbershopId={barbershopId} />;
}

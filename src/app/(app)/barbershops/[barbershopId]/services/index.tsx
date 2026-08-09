import { ServicesScreen } from '@/features/services/components/services-screen';
import { useServiceRouteIds } from '@/features/services/hooks/use-service-route-ids';

export default function ServicesRoute() {
  const { barbershopId } = useServiceRouteIds();
  return <ServicesScreen barbershopId={barbershopId} />;
}

import { ServiceDetailScreen } from '@/features/services/components/service-detail-screen';
import { useServiceRouteIds } from '@/features/services/hooks/use-service-route-ids';

export default function ServiceDetailRoute() {
  const { barbershopId, serviceId, saved } = useServiceRouteIds();
  return <ServiceDetailScreen barbershopId={barbershopId} saved={saved} serviceId={serviceId} />;
}

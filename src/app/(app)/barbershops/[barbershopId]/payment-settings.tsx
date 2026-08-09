import { YapeSettingsScreen } from '@/features/barbershops/components/yape-settings-screen';
import { useBarbershopRouteId } from '@/features/barbershops/hooks/use-barbershop-route-id';

export default function YapeSettingsRoute() {
  const barbershopId = useBarbershopRouteId();

  return <YapeSettingsScreen barbershopId={barbershopId} />;
}

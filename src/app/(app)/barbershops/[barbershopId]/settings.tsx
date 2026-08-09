import { BarbershopSettingsScreen } from '@/features/barbershops/components/barbershop-settings-screen';
import { useBarbershopRouteId } from '@/features/barbershops/hooks/use-barbershop-route-id';

export default function BarbershopSettingsRoute() {
  const barbershopId = useBarbershopRouteId();

  return <BarbershopSettingsScreen barbershopId={barbershopId} />;
}

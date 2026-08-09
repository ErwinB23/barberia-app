import { EditBarbershopScreen } from '@/features/barbershops/components/edit-barbershop-screen';
import { useBarbershopRouteId } from '@/features/barbershops/hooks/use-barbershop-route-id';

export default function EditBarbershopRoute() {
  const barbershopId = useBarbershopRouteId();

  return <EditBarbershopScreen barbershopId={barbershopId} />;
}

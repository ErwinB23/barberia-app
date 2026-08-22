import { useBarbershopRouteId } from '@/features/barbershops/hooks/use-barbershop-route-id';
import { AdminHomeScreen } from '@/features/home/components/admin-home-screen';

export default function AdminHomeRoute() {
  const barbershopId = useBarbershopRouteId();

  return <AdminHomeScreen barbershopId={barbershopId} />;
}

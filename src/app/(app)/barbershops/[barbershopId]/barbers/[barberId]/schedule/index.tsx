import { BarberScheduleScreen } from '@/features/barbers/components/barber-schedule-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function BarberScheduleRoute() {
  const { barbershopId, barberId, saved } = useBarberRouteParams();
  return <BarberScheduleScreen barberId={barberId} barbershopId={barbershopId} saved={saved} />;
}

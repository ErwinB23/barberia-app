import { ClosuresScreen } from '@/features/schedules/components/closures-screen';
import { useScheduleRouteParams } from '@/features/schedules/hooks/use-schedule-route-params';

export default function ClosuresRoute() {
  const { barbershopId, saved } = useScheduleRouteParams();
  return <ClosuresScreen barbershopId={barbershopId} saved={saved} />;
}

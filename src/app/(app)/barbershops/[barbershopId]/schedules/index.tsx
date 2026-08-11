import { WeeklyScheduleScreen } from '@/features/schedules/components/weekly-schedule-screen';
import { useScheduleRouteParams } from '@/features/schedules/hooks/use-schedule-route-params';

export default function WeeklyScheduleRoute() {
  const { barbershopId, saved } = useScheduleRouteParams();
  return <WeeklyScheduleScreen barbershopId={barbershopId} saved={saved} />;
}

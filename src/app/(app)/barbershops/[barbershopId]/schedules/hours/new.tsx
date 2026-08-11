import { HourEditorScreen } from '@/features/schedules/components/hour-editor-screen';
import { useScheduleRouteParams } from '@/features/schedules/hooks/use-schedule-route-params';

export default function CreateHourRoute() {
  const { barbershopId, weekday } = useScheduleRouteParams();
  return <HourEditorScreen barbershopId={barbershopId} mode="create" weekday={weekday} />;
}

import { HourEditorScreen } from '@/features/schedules/components/hour-editor-screen';
import { useScheduleRouteParams } from '@/features/schedules/hooks/use-schedule-route-params';

export default function EditHourRoute() {
  const { barbershopId, hourId } = useScheduleRouteParams();
  return <HourEditorScreen barbershopId={barbershopId} hourId={hourId} mode="edit" />;
}

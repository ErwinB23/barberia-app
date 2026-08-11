import { ClosureEditorScreen } from '@/features/schedules/components/closure-editor-screen';
import { useScheduleRouteParams } from '@/features/schedules/hooks/use-schedule-route-params';

export default function CreateClosureRoute() {
  const { barbershopId } = useScheduleRouteParams();
  return <ClosureEditorScreen barbershopId={barbershopId} />;
}

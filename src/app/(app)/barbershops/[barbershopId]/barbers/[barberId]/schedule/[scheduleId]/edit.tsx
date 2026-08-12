import { BarberScheduleEditorScreen } from '@/features/barbers/components/barber-schedule-editor-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function EditBarberScheduleRoute() {
  const { barbershopId, barberId, scheduleId } = useBarberRouteParams();
  return (
    <BarberScheduleEditorScreen
      barberId={barberId}
      barbershopId={barbershopId}
      mode="edit"
      scheduleId={scheduleId}
      weekday={null}
    />
  );
}

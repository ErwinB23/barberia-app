import { BarberScheduleEditorScreen } from '@/features/barbers/components/barber-schedule-editor-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function CreateBarberScheduleRoute() {
  const { barbershopId, barberId, weekday } = useBarberRouteParams();
  return (
    <BarberScheduleEditorScreen
      barberId={barberId}
      barbershopId={barbershopId}
      mode="create"
      scheduleId={null}
      weekday={weekday}
    />
  );
}

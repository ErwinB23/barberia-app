import { AppointmentAgendaScreen } from '@/features/reservations/components/appointment-agenda-screen';
import { useAppointmentRouteParams } from '@/features/reservations/hooks/use-appointment-route-params';

export default function AdminAppointmentsRoute() {
  const { barbershopId } = useAppointmentRouteParams();
  return <AppointmentAgendaScreen barbershopId={barbershopId} />;
}

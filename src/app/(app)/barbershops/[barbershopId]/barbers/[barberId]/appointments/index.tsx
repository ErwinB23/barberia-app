import { AppointmentAgendaScreen } from '@/features/reservations/components/appointment-agenda-screen';
import { useAppointmentRouteParams } from '@/features/reservations/hooks/use-appointment-route-params';

export default function BarberAppointmentsRoute() {
  const { barbershopId, barberId } = useAppointmentRouteParams();
  return <AppointmentAgendaScreen barberId={barberId} barbershopId={barbershopId} />;
}

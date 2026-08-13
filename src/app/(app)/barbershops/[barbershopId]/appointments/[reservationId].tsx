import { OperationalAppointmentDetailScreen } from '@/features/reservations/components/operational-appointment-detail-screen';
import { useAppointmentRouteParams } from '@/features/reservations/hooks/use-appointment-route-params';

export default function AdminAppointmentDetailRoute() {
  const { barbershopId, reservationId } = useAppointmentRouteParams();
  return (
    <OperationalAppointmentDetailScreen barbershopId={barbershopId} reservationId={reservationId} />
  );
}

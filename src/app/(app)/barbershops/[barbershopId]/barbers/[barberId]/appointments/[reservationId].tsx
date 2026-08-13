import { OperationalAppointmentDetailScreen } from '@/features/reservations/components/operational-appointment-detail-screen';
import { useAppointmentRouteParams } from '@/features/reservations/hooks/use-appointment-route-params';

export default function BarberAppointmentDetailRoute() {
  const { barbershopId, barberId, reservationId } = useAppointmentRouteParams();
  return (
    <OperationalAppointmentDetailScreen
      barberId={barberId}
      barbershopId={barbershopId}
      reservationId={reservationId}
    />
  );
}

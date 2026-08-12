import { BarberProfileEditorScreen } from '@/features/barbers/components/barber-profile-editor-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function EditBarberProfileRoute() {
  const { barbershopId, barberId } = useBarberRouteParams();
  return <BarberProfileEditorScreen barberId={barberId} barbershopId={barbershopId} />;
}

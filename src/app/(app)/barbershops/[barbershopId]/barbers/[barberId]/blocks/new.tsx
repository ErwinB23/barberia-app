import { BarberBlockEditorScreen } from '@/features/barbers/components/barber-block-editor-screen';
import { useBarberRouteParams } from '@/features/barbers/hooks/use-barber-route-params';

export default function CreateBarberBlockRoute() {
  const { barbershopId, barberId } = useBarberRouteParams();
  return <BarberBlockEditorScreen barberId={barberId} barbershopId={barbershopId} />;
}

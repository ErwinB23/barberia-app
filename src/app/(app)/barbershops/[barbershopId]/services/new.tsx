import { ServiceEditorScreen } from '@/features/services/components/service-editor-screen';
import { useServiceRouteIds } from '@/features/services/hooks/use-service-route-ids';

export default function CreateServiceRoute() {
  const { barbershopId } = useServiceRouteIds();
  return <ServiceEditorScreen barbershopId={barbershopId} mode="create" />;
}

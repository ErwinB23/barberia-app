import { StyleEditorScreen } from '@/features/services/components/style-editor-screen';
import { useServiceRouteIds } from '@/features/services/hooks/use-service-route-ids';

export default function CreateStyleRoute() {
  const { barbershopId, serviceId } = useServiceRouteIds();
  return <StyleEditorScreen barbershopId={barbershopId} mode="create" serviceId={serviceId} />;
}

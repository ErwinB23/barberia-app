import { ServiceEditorScreen } from '@/features/services/components/service-editor-screen';
import { useServiceRouteIds } from '@/features/services/hooks/use-service-route-ids';

export default function EditServiceRoute() {
  const { barbershopId, serviceId } = useServiceRouteIds();
  return <ServiceEditorScreen barbershopId={barbershopId} mode="edit" serviceId={serviceId} />;
}

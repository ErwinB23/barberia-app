import { AdminInvitationsScreen } from '@/features/invitations/components/admin-invitations-screen';
import { useInvitationRouteParams } from '@/features/invitations/hooks/use-invitation-route-params';

export default function AdminInvitationsRoute() {
  const { barbershopId } = useInvitationRouteParams();
  return <AdminInvitationsScreen barbershopId={barbershopId} />;
}

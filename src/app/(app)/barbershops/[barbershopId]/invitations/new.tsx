import { NewInvitationScreen } from '@/features/invitations/components/new-invitation-screen';
import { useInvitationRouteParams } from '@/features/invitations/hooks/use-invitation-route-params';

export default function NewInvitationRoute() {
  const { barbershopId } = useInvitationRouteParams();
  return <NewInvitationScreen barbershopId={barbershopId} />;
}

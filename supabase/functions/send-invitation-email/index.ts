import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

import {
  buildInvitationEmail,
  getInvitationEmailEligibility,
  InvitationEmailDeliveryError,
  parseInvitationEmailRequest,
  sendInvitationEmailWithResend,
} from './email.ts';

type InvitationRecord = {
  id: string;
  barbershop_id: string;
  email: string;
  role: 'barber' | 'administrator';
  channel: 'app' | 'email';
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  expires_at: string;
};

function jsonError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

function isInvitationRecord(value: unknown): value is InvitationRecord {
  if (!value || typeof value !== 'object') return false;
  const invitation = value as Record<string, unknown>;

  return (
    typeof invitation.id === 'string' &&
    typeof invitation.barbershop_id === 'string' &&
    typeof invitation.email === 'string' &&
    (invitation.role === 'barber' || invitation.role === 'administrator') &&
    (invitation.channel === 'app' || invitation.channel === 'email') &&
    ['pending', 'accepted', 'rejected', 'expired', 'cancelled'].includes(
      String(invitation.status),
    ) &&
    typeof invitation.expires_at === 'string'
  );
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, 'invalid_json', 'El cuerpo de la solicitud debe ser JSON válido.');
    }

    let invitationId: string;
    try {
      ({ invitationId } = parseInvitationEmailRequest(body));
    } catch {
      return jsonError(400, 'invalid_request', 'Se requiere un invitation_id válido.');
    }

    const actorId = context.userClaims?.id;
    if (!actorId) {
      return jsonError(401, 'authentication_required', 'Debes iniciar sesión.');
    }

    const { data: invitationData, error: invitationError } = await context.supabase
      .from('barbershop_invitations')
      .select('id, barbershop_id, email, role, channel, status, expires_at')
      .eq('id', invitationId)
      .maybeSingle();

    if (invitationError) {
      return jsonError(500, 'invitation_lookup_failed', 'No pudimos consultar la invitación.');
    }
    if (!invitationData) {
      return jsonError(404, 'invitation_not_found', 'La invitación no está disponible.');
    }
    if (!isInvitationRecord(invitationData)) {
      return jsonError(500, 'invalid_invitation_data', 'La invitación no se pudo procesar.');
    }

    const { data: membership, error: membershipError } = await context.supabase
      .from('barbershop_memberships')
      .select('id')
      .eq('barbershop_id', invitationData.barbershop_id)
      .eq('user_id', actorId)
      .eq('role', 'administrator')
      .eq('status', 'active')
      .maybeSingle();

    if (membershipError) {
      return jsonError(500, 'authorization_lookup_failed', 'No pudimos comprobar tus permisos.');
    }
    if (!membership) {
      return jsonError(403, 'forbidden', 'No tienes permiso para enviar esta invitación.');
    }

    const eligibility = getInvitationEmailEligibility({
      channel: invitationData.channel,
      status: invitationData.status,
      expiresAt: invitationData.expires_at,
    });
    if (eligibility === 'wrong_channel') {
      return jsonError(409, 'wrong_channel', 'Esta invitación no utiliza el canal email.');
    }
    if (eligibility === 'not_pending') {
      return jsonError(409, 'invitation_not_pending', 'La invitación ya no está pendiente.');
    }
    if (eligibility === 'expired') {
      return jsonError(410, 'invitation_expired', 'La invitación ha vencido.');
    }

    const { data: barbershop, error: barbershopError } = await context.supabase
      .from('barbershops')
      .select('name')
      .eq('id', invitationData.barbershop_id)
      .maybeSingle();

    if (barbershopError || !barbershop || typeof barbershop.name !== 'string') {
      return jsonError(500, 'barbershop_lookup_failed', 'No pudimos consultar la barbería.');
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    if (!apiKey || !fromEmail) {
      return jsonError(503, 'email_not_configured', 'El envío por correo no está disponible.');
    }

    try {
      await sendInvitationEmailWithResend({
        apiKey,
        fromEmail,
        recipientEmail: invitationData.email,
        invitationId: invitationData.id,
        content: buildInvitationEmail({
          barbershopName: barbershop.name,
          role: invitationData.role,
        }),
      });
    } catch (error) {
      if (error instanceof InvitationEmailDeliveryError) {
        return jsonError(
          502,
          'email_delivery_failed',
          'La invitación se guardó, pero el correo no pudo enviarse.',
        );
      }

      return jsonError(500, 'email_processing_failed', 'El correo no se pudo procesar.');
    }

    return Response.json({ ok: true });
  }),
};

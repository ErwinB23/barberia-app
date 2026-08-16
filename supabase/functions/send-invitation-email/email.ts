export type InvitationEmailRole = 'barber' | 'administrator';

type InvitationEmailContent = {
  subject: string;
  text: string;
  html: string;
};

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type SendInvitationEmailOptions = {
  apiKey: string;
  fromEmail: string;
  recipientEmail: string;
  invitationId: string;
  content: InvitationEmailContent;
  fetcher?: Fetcher;
};

type InvitationEmailEligibilityInput = {
  channel: string;
  status: string;
  expiresAt: string;
};

export type InvitationEmailEligibility = 'ready' | 'wrong_channel' | 'not_pending' | 'expired';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ROLE_LABELS: Record<InvitationEmailRole, string> = {
  barber: 'Barbero',
  administrator: 'Administrador',
};

export class InvitationEmailDeliveryError extends Error {
  readonly code = 'resend_delivery_failed';

  constructor() {
    super('No se pudo entregar el correo de invitación.');
    this.name = 'InvitationEmailDeliveryError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRoleLabel(role: string) {
  if (!(role in ROLE_LABELS)) {
    throw new Error('El rol de la invitación no es compatible con el envío por correo.');
  }

  return ROLE_LABELS[role as InvitationEmailRole];
}

function normalizeDisplayText(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function parseInvitationEmailRequest(value: unknown) {
  if (!isRecord(value)) {
    throw new Error('Se requiere invitation_id.');
  }

  const keys = Object.keys(value);
  if (
    keys.length !== 1 ||
    keys[0] !== 'invitation_id' ||
    typeof value.invitation_id !== 'string' ||
    !UUID_PATTERN.test(value.invitation_id)
  ) {
    throw new Error('invitation_id debe ser un UUID válido y el único dato enviado.');
  }

  return { invitationId: value.invitation_id };
}

export function getInvitationEmailEligibility(
  invitation: InvitationEmailEligibilityInput,
  now = Date.now(),
): InvitationEmailEligibility {
  if (invitation.channel !== 'email') return 'wrong_channel';
  if (invitation.status !== 'pending') return 'not_pending';
  if (new Date(invitation.expiresAt).getTime() <= now) return 'expired';
  return 'ready';
}

export function buildInvitationEmail({
  barbershopName,
  role,
}: {
  barbershopName: string;
  role: string;
}): InvitationEmailContent {
  const safeBarbershopName = normalizeDisplayText(barbershopName);
  const roleLabel = getRoleLabel(role);
  const escapedBarbershopName = escapeHtml(safeBarbershopName);
  const escapedRole = escapeHtml(roleLabel);
  const subject = `Invitación para unirte a ${safeBarbershopName}`;
  const instructions =
    'Abre Barbería App e inicia sesión con el correo al que recibiste esta invitación. Luego ve a Invitaciones para aceptar o rechazar.';

  return {
    subject,
    text: `${safeBarbershopName} te invitó a formar parte de su equipo como ${roleLabel}.\n\n${instructions}`,
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f4f1ec;color:#24201d;font-family:Arial,sans-serif;">
    <div style="box-sizing:border-box;max-width:600px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #ded8d0;border-radius:16px;padding:32px;">
        <p style="margin:0 0 12px;color:#725b3f;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Barbería App</p>
        <h1 style="margin:0 0 20px;font-size:25px;line-height:1.25;">Invitación al equipo</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;"><strong>${escapedBarbershopName}</strong> te invitó a formar parte de su equipo.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Rol ofrecido: <strong>${escapedRole}</strong></p>
        <p style="margin:0;font-size:16px;line-height:1.6;">${escapeHtml(instructions)}</p>
      </div>
    </div>
  </body>
</html>`,
  };
}

export async function sendInvitationEmailWithResend({
  apiKey,
  fromEmail,
  recipientEmail,
  invitationId,
  content,
  fetcher = fetch,
}: SendInvitationEmailOptions) {
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `barbershop-invitation/${invitationId}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipientEmail],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  if (!response.ok) {
    throw new InvitationEmailDeliveryError();
  }
}

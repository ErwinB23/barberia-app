import type {
  BarbershopStatus,
  MembershipQueryRow,
  MembershipRole,
  UserBarbershop,
} from './types.ts';

export function mapMembershipRows(rows: MembershipQueryRow[]): UserBarbershop[] {
  return rows.flatMap((row) => {
    if (!row.barbershop) {
      return [];
    }

    return [
      {
        membershipId: row.id,
        role: row.role,
        barbershop: {
          id: row.barbershop.id,
          name: row.barbershop.name,
          status: row.barbershop.status,
          phone: row.barbershop.phone,
          address: row.barbershop.address,
          description: row.barbershop.description,
          locationReference: row.barbershop.location_reference,
          logoUrl: row.barbershop.logo_url,
          createdAt: row.barbershop.created_at,
          updatedAt: row.barbershop.updated_at,
        },
      },
    ];
  });
}

export function getMembershipRoleLabel(role: MembershipRole) {
  return role === 'administrator' ? 'Administrador' : 'Barbero';
}

export function getBarbershopStatusLabel(status: BarbershopStatus) {
  const labels: Record<BarbershopStatus, string> = {
    unpublished: 'No publicada',
    published: 'Publicada',
    paused: 'Pausada',
  };

  return labels[status];
}

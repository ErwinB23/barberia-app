import type { UserProfile } from '@/features/profile/types';
import type {
  ParsedProfileFormValues,
  ProfileSpaceSource,
} from '@/features/profile/profile-domain';
import { supabase } from '@/infrastructure/supabase/client';

const PROFILE_COLUMNS = 'id, full_name, phone, avatar_url';

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function parseProfile(value: unknown, expectedUserId: string): UserProfile {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid profile response');
  }

  const profile = value as Record<string, unknown>;

  if (
    profile.id !== expectedUserId ||
    !isNullableString(profile.full_name) ||
    !isNullableString(profile.phone) ||
    !isNullableString(profile.avatar_url)
  ) {
    throw new Error('Invalid profile response');
  }

  return {
    id: profile.id,
    fullName: profile.full_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
  };
}

export async function loadOwnProfile(
  userId: string,
  registrationPhone: string | null,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  const profile = parseProfile(data, userId);

  if (profile.phone || !registrationPhone) {
    return profile;
  }

  const { data: updatedData, error: updateError } = await supabase
    .from('profiles')
    .update({ phone: registrationPhone })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (updateError) {
    throw updateError;
  }

  return parseProfile(updatedData, userId);
}

export async function updateOwnProfile(
  userId: string,
  values: ParsedProfileFormValues,
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: values.fullName,
      phone: values.phone,
      avatar_url: values.avatarUrl,
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return parseProfile(data, userId);
}

export async function loadOwnProfileSpaces(userId: string): Promise<ProfileSpaceSource[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from('barbershop_memberships')
    .select(
      `
        role,
        barbershop:barbershops!barbershop_memberships_barbershop_id_fkey (
          id,
          name
        )
      `,
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false });

  if (membershipsError) throw membershipsError;

  return Promise.all(
    memberships.flatMap((membership) => {
      if (!membership.barbershop) return [];

      return [
        (async (): Promise<ProfileSpaceSource> => {
          const { data: ownProfile, error: ownProfileError } = await supabase
            .rpc('get_own_barber_profile', {
              p_barbershop_id: membership.barbershop.id,
            })
            .maybeSingle();

          if (ownProfileError) throw ownProfileError;

          return {
            barbershopId: membership.barbershop.id,
            barbershopName: membership.barbershop.name,
            role: membership.role,
            ownBarberProfile: ownProfile
              ? { barberId: ownProfile.barber_id, isActive: ownProfile.is_active }
              : null,
          };
        })(),
      ];
    }),
  );
}

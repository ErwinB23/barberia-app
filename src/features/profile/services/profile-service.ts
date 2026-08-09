import type { UserProfile } from '@/features/profile/types';
import { supabase } from '@/infrastructure/supabase/client';

const PROFILE_COLUMNS = 'id, full_name, phone';

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
    !isNullableString(profile.phone)
  ) {
    throw new Error('Invalid profile response');
  }

  return {
    id: profile.id,
    fullName: profile.full_name,
    phone: profile.phone,
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

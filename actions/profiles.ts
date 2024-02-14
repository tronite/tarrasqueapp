'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

import { createServerClient } from '@/utils/supabase/server';

import { getUser } from './auth';

export type Profile = Awaited<ReturnType<typeof getProfile>>;

/**
 * Get the user profile
 * @returns The user profile
 */
export async function getProfile() {
  // Connect to Supabase
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  const user = await getUser();
  if (!user) {
    throw new Error('User not found');
  }

  // Get the user
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      *,
      avatar: media!profiles_avatar_id_fkey (
        *
      )
    `,
    )
    .eq('id', user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a user profile
 * @param data - The data to update the profile with
 */
export async function updateProfile({ name, avatar_id }: { name?: string; avatar_id?: string | null }) {
  // Validate the data
  const schema = z.object({
    name: z.string().optional(),
    avatar_id: z.string().uuid().nullable().optional(),
  });
  schema.parse({ name, avatar_id });

  // Connect to Supabase
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  // Get the user
  const user = await getUser();
  if (!user) {
    throw new Error('User not found');
  }

  // Update the profile
  const { error } = await supabase.from('profiles').update({ name, avatar_id }).eq('id', user.id);

  if (error) {
    throw error;
  }
}

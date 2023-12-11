'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

import { config } from '@/lib/config';
import { createAdminServerClient } from '@/utils/supabase/admin';
import { createServerClient } from '@/utils/supabase/server';

import { sendCampaignInviteExistingUserEmail, sendCampaignInviteNewUserEmail } from './email';
import { getProfile } from './profiles';

export type Invite = Awaited<ReturnType<typeof getInvite>>;

/**
 * Get campaign's invites
 * @param campaignId - The campaign to get invites for
 * @returns The campaign's invites
 */
export async function getInvites(campaignId: string) {
  // Validate the campaign ID
  const schema = z.string().uuid();
  schema.parse(campaignId);

  // Connect to Supabase
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  // Get the invites
  const { data, error } = await supabase.from('invites').select('*').eq('campaign_id', campaignId);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get an invite
 * @param inviteId - The invite to get
 * @returns The invite
 */
export async function getInvite(inviteId: string) {
  // Validate the invite ID
  const schema = z.string().uuid();
  schema.parse(inviteId);

  // Connect to Supabase
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  // Get the invite
  const { data, error } = await supabase
    .from('invites')
    .select(
      `
      *,
      campaign: campaigns!invites_campaign_id_fkey (
        name
      )
      `,
    )
    .eq('id', inviteId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Create an invite
 * @param campaign_id - The campaign to create an invite for
 * @param email - The email to invite
 * @returns The created invite
 */
export async function createInvite({ campaign_id, email }: { campaign_id: string; email: string }) {
  // Validate the campaign ID
  const schema = z.object({ campaign_id: z.string().uuid(), email: z.string().email().min(1) });
  schema.parse({ campaign_id, email });

  // Connect to Supabase
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  // Get the current user's profile
  const profile = await getProfile();

  // Check if an invite for this email already exists for this campaign
  const { data: existingInvite, error: existingInviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('campaign_id', campaign_id)
    .eq('email', email);

  if (existingInviteError) {
    throw existingInviteError;
  }

  if (existingInvite?.length) {
    throw new Error('An invite for this email already exists for this campaign');
  }

  // Check if the email is already a member of this campaign
  const { data: existingMembership } = await supabase
    .from('memberships')
    .select(
      `
      *,
      user: profiles!memberships_user_id_fkey (
        email
      )
    `,
    )
    .eq('campaign_id', campaign_id)
    .eq('user.email', email)
    .not('user', 'is', 'NULL');

  if (existingMembership?.length) {
    throw new Error('This email is already a member of this campaign');
  }

  // Check if the email is already a user
  const { data: existingUser } = await supabase.from('profiles').select().eq('email', email).single();

  // Create the invite
  const { data, error } = await supabase
    .from('invites')
    .insert({ campaign_id, email, user_id: existingUser?.id })
    .select(
      `
      *,
      campaign: campaigns!invites_campaign_id_fkey (
        name
      )
      `,
    )
    .single();

  if (error) {
    throw error;
  }

  if (existingUser) {
    const supabase = createAdminServerClient(cookieStore);

    const { data: generatedLink, error } = await supabase.auth.admin.generateLink({ type: 'magiclink', email });

    if (error) {
      throw error;
    }

    const searchParams = new URLSearchParams({
      token_hash: generatedLink.properties.hashed_token,
      next: '/dashboard',
    });
    const link = `${config.HOST}/auth/sign-in/callback?${searchParams}`;

    await sendCampaignInviteExistingUserEmail({
      hostName: profile.display_name,
      inviteeName: existingUser.name.split(' ')[0]!,
      campaignName: data.campaign!.name,
      to: email,
      acceptInviteUrl: link,
    });
  } else {
    await sendCampaignInviteNewUserEmail({
      hostName: profile.display_name,
      campaignName: data.campaign!.name,
      to: email,
      signUpUrl: `${config.HOST}/auth/sign-up?token=${data.id}`,
    });
  }

  return data;
}

/**
 * Delete an invite
 * @param inviteId - The invite to delete
 */
export async function deleteInvite(inviteId: string) {
  // Validate the invite ID
  const schema = z.string().uuid();
  schema.parse(inviteId);

  // Connect to Supabase
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  // Delete the invite
  const { error } = await supabase.from('invites').delete().eq('id', inviteId);

  if (error) {
    throw error;
  }
}

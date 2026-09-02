import { supabase } from '../lib/supabase';
import { UserProfileDetails } from '../types/profile';
import { formatProfileDateOfBirth } from '../utils/profileFormat';
import { isMissingTableError } from '../utils/supabaseErrors';

type ProfileRow = {
  full_name: string;
  mobile_number: string;
  email_address: string;
  date_of_birth: string;
};

type KycRow = {
  pan_number: string;
};

export async function getProfileFullName(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.full_name?.trim() || null;
}

export async function getProfileFirstName(userId: string): Promise<string | null> {
  const fullName = await getProfileFullName(userId);
  if (!fullName) {
    return null;
  }
  return fullName.split(/\s+/)[0] ?? fullName;
}

export async function getMobileVerifiedStatus(userId: string): Promise<boolean | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('mobile_verified')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return Boolean(data.mobile_verified);
}

export async function getProfileMobileNumber(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('mobile_number')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw new Error(error.message);
  }

  return data?.mobile_number?.trim() || null;
}

export async function getRecoveryMobileByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_recovery_mobile_by_email', {
    p_email: email.trim().toLowerCase(),
  });

  if (error) {
    if (error.message.includes('function') && error.message.includes('does not exist')) {
      throw new Error(
        'Password recovery is unavailable. Apply migration 008_otp_recovery.sql first.'
      );
    }
    throw new Error(error.message);
  }

  return typeof data === 'string' ? data.trim() || null : null;
}

export async function markMobileVerified(): Promise<void> {
  const { error } = await supabase.rpc('mark_mobile_verified');

  if (error) {
    if (error.message.includes('function') && error.message.includes('does not exist')) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('Unauthorized');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ mobile_verified: true })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
      return;
    }
    throw new Error(error.message);
  }
}

export async function completePasswordRecovery(
  email: string,
  newPassword: string
): Promise<void> {
  const { error } = await supabase.rpc('complete_password_recovery', {
    p_email: email.trim().toLowerCase(),
    p_new_password: newPassword,
  });

  if (error) {
    if (
      error.message.includes('function') &&
      (error.message.includes('does not exist') ||
        error.message.includes('not found'))
    ) {
      throw new Error(
        'Password recovery is unavailable. Apply migration 008_otp_recovery.sql in Supabase SQL Editor.'
      );
    }
    throw new Error(error.message);
  }
}

export async function getUserProfileDetails(
  userId: string,
  fallbackEmail?: string | null
): Promise<UserProfileDetails | null> {
  const [profileResult, kycResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, mobile_number, email_address, date_of_birth')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('kyc_documents')
      .select('pan_number')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    if (isMissingTableError(profileResult.error)) {
      return null;
    }
    throw new Error(profileResult.error.message);
  }

  if (!profileResult.data) {
    return null;
  }

  if (kycResult.error && !isMissingTableError(kycResult.error)) {
    throw new Error(kycResult.error.message);
  }

  const profile = profileResult.data as ProfileRow;
  const kyc = (kycResult.data as KycRow | null) ?? null;
  const emailAddress =
    profile.email_address?.trim() || fallbackEmail?.trim() || '';

  return {
    fullName: profile.full_name.trim(),
    mobileNumber: profile.mobile_number.trim(),
    emailAddress,
    dateOfBirth: formatProfileDateOfBirth(profile.date_of_birth),
    panNumber: kyc?.pan_number?.trim() || null,
    verified: Boolean(kyc),
  };
}

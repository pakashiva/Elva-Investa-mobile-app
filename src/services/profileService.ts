import { apiRequest } from '../lib/api';
import { CustomerPayload } from '../types/auth';
import { UserProfileDetails } from '../types/profile';
import { formatProfileDateOfBirth } from '../utils/profileFormat';
import { getStoredSession, persistSession, getStoredToken } from './sessionStore';

type ProfileResponse = {
  profile: {
    fullName: string;
    mobileNumber: string;
    emailAddress: string;
    dateOfBirth: string;
    panNumber: string | null;
    customerId: string | null;
    verified: boolean;
  };
};

export async function getProfileFullName(
  _userId?: string
): Promise<string | null> {
  const session = await getStoredSession();
  if (session?.customer?.fullName) {
    return session.customer.fullName.trim();
  }
  const details = await getUserProfileDetails();
  return details?.fullName?.trim() || null;
}

export async function getProfileFirstName(
  _userId?: string
): Promise<string | null> {
  const fullName = await getProfileFullName();
  if (!fullName) {
    return null;
  }
  return fullName.split(/\s+/)[0] ?? fullName;
}

export async function getMobileVerifiedStatus(
  _userId?: string
): Promise<boolean | null> {
  try {
    const data = await apiRequest<{ customer: CustomerPayload }>(
      '/api/mobile/auth/me'
    );
    const token = await getStoredToken();
    if (token && data.customer) {
      await persistSession(token, data.customer);
    }
    return Boolean(data.customer?.mobileVerified);
  } catch {
    const session = await getStoredSession();
    if (!session?.customer) {
      return null;
    }
    return Boolean(session.customer.mobileVerified);
  }
}

export async function getProfileMobileNumber(
  _userId?: string
): Promise<string | null> {
  const session = await getStoredSession();
  if (session?.customer?.mobileNumber) {
    return session.customer.mobileNumber;
  }
  const details = await getUserProfileDetails();
  return details?.mobileNumber?.trim() || null;
}

export async function markMobileVerified(): Promise<void> {
  const data = await apiRequest<{ customer: CustomerPayload }>(
    '/api/mobile/auth/verify-mobile',
    { method: 'POST' }
  );
  const token = await getStoredToken();
  if (token && data.customer) {
    await persistSession(token, data.customer);
  }
}

export async function getUserProfileDetails(
  _userId?: string,
  _fallbackEmail?: string | null
): Promise<UserProfileDetails | null> {
  try {
    const data = await apiRequest<ProfileResponse>('/api/mobile/profile');
    const profile = data.profile;
    if (!profile) {
      return null;
    }
    return {
      fullName: profile.fullName.trim(),
      mobileNumber: profile.mobileNumber.trim(),
      emailAddress: profile.emailAddress.trim(),
      dateOfBirth: formatProfileDateOfBirth(profile.dateOfBirth),
      panNumber: profile.panNumber?.trim() || null,
      customerId: profile.customerId,
      verified: Boolean(profile.verified),
    };
  } catch {
    const session = await getStoredSession();
    if (!session?.customer) {
      return null;
    }
    return {
      fullName: session.customer.fullName,
      mobileNumber: session.customer.mobileNumber,
      emailAddress: session.customer.emailAddress,
      dateOfBirth: '',
      panNumber: null,
      customerId: session.customer.customerCode,
      verified: false,
    };
  }
}

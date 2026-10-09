import { apiRequest } from '../lib/api';
import { OtpMode } from '../types/otp';
import { CustomerPayload } from '../types/auth';
import { maskMobileNumber } from '../utils/phoneNumber';
import { persistSession, getStoredSession } from './sessionStore';
import { saveMpin } from './mpinStore';
import { getProfileMobileNumber } from './profileService';

export type OtpActionResponse = {
  success: boolean;
  message: string;
  expiresIn?: number;
  requestId?: string;
  maskedPhone?: string;
  resetToken?: string;
};

type PhoneContext = {
  phone: string;
  maskedPhone: string;
};

const EMAIL_RECOVERY_MODES: OtpMode[] = [
  'forgotMpin',
  'changeMpin',
  'forgotPassword',
  'changePassword',
];

const SIGNED_IN_OTP_MODES: OtpMode[] = ['changeMpin', 'changePassword'];

let lastPasswordResetToken: string | null = null;

async function resolveRegistrationPhone(options?: {
  userId?: string;
  mobileNumber?: string;
}): Promise<PhoneContext> {
  const rawMobile =
    options?.mobileNumber?.trim() ||
    (options?.userId ? await getProfileMobileNumber(options.userId) : null);

  if (!rawMobile) {
    throw new Error('Registered mobile number not found.');
  }

  const digits = rawMobile.replace(/\D/g, '');
  const local = digits.startsWith('91') && digits.length >= 12 ? digits.slice(-10) : digits;

  return {
    phone: local,
    maskedPhone: maskMobileNumber(rawMobile),
  };
}

async function callAuthOtp(
  path: 'send' | 'resend' | 'verify',
  mode: OtpMode,
  options?: { email?: string; mobileNumber?: string; otp?: string; clientCode?: string }
): Promise<OtpActionResponse> {
  const data = await apiRequest<OtpActionResponse>(
    path === 'verify' ? '/api/mobile/auth/otp/verify' : '/api/mobile/auth/otp/send',
    {
      method: 'POST',
      auth: SIGNED_IN_OTP_MODES.includes(mode),
      body: JSON.stringify({
        mode,
        email: options?.email?.trim().toLowerCase(),
        mobileNumber: options?.mobileNumber,
        clientCode: options?.clientCode?.trim().toUpperCase() || undefined,
        action: path === 'resend' ? 'resend' : 'send',
        otp: options?.otp,
      }),
    }
  );

  if (data.resetToken) {
    lastPasswordResetToken = data.resetToken;
  }

  return {
    success: true,
    message: data.message || 'OTP sent successfully',
    expiresIn: data.expiresIn,
    requestId: data.requestId,
    maskedPhone: data.maskedPhone,
    resetToken: data.resetToken,
  };
}

export async function sendOtp(options?: {
  mode?: OtpMode;
  email?: string;
  userId?: string;
  mobileNumber?: string;
  clientCode?: string;
}): Promise<OtpActionResponse> {
  const mode = options?.mode ?? 'registration';

  if (EMAIL_RECOVERY_MODES.includes(mode)) {
    return callAuthOtp('send', mode, {
      email: options?.email,
      clientCode: options?.clientCode,
    });
  }

  const phoneContext = await resolveRegistrationPhone(options);
  return callAuthOtp('send', 'registration', { mobileNumber: phoneContext.phone });
}

export async function resendOtp(options?: {
  mode?: OtpMode;
  email?: string;
  userId?: string;
  mobileNumber?: string;
  clientCode?: string;
}): Promise<OtpActionResponse> {
  const mode = options?.mode ?? 'registration';

  if (EMAIL_RECOVERY_MODES.includes(mode)) {
    return callAuthOtp('resend', mode, {
      email: options?.email,
      clientCode: options?.clientCode,
    });
  }

  const phoneContext = await resolveRegistrationPhone(options);
  return callAuthOtp('resend', 'registration', { mobileNumber: phoneContext.phone });
}

export async function verifyOtp(
  otp: string,
  options?: {
    mode?: OtpMode;
    email?: string;
    userId?: string;
    mobileNumber?: string;
    clientCode?: string;
  }
): Promise<OtpActionResponse> {
  const cleaned = otp.replace(/\D/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    throw new Error('Please enter a valid 6-digit OTP.');
  }

  const mode = options?.mode ?? 'registration';

  if (EMAIL_RECOVERY_MODES.includes(mode)) {
    return callAuthOtp('verify', mode, {
      email: options?.email,
      clientCode: options?.clientCode,
      otp: cleaned,
    });
  }

  const phoneContext = await resolveRegistrationPhone(options);
  return callAuthOtp('verify', 'registration', {
    mobileNumber: phoneContext.phone,
    otp: cleaned,
  });
}

export async function completeMpinReset(
  email: string,
  newMpin: string
): Promise<OtpActionResponse> {
  const session = await getStoredSession();
  await saveMpin({
    customerId: session?.customer?.id,
    email: email.trim().toLowerCase() || session?.customer?.emailAddress,
    mpin: newMpin,
  });
  return {
    success: true,
    message: 'MPIN updated successfully.',
  };
}

export async function completePasswordReset(
  email: string,
  newPassword: string
): Promise<OtpActionResponse> {
  if (!lastPasswordResetToken) {
    throw new Error('Verify the OTP before setting a new password.');
  }

  const data = await apiRequest<{
    token?: string;
    customer?: CustomerPayload;
    message?: string;
  }>('/api/mobile/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      resetToken: lastPasswordResetToken,
      newPassword,
      email: email.trim().toLowerCase(),
    }),
  });

  lastPasswordResetToken = null;
  if (data.token && data.customer) {
    await persistSession(data.token, data.customer);
  }

  return {
    success: true,
    message: data.message ?? 'Password updated successfully.',
  };
}

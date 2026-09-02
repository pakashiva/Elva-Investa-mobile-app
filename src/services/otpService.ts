import { OtpMode } from '../types/otp';
import {
  getOtpApiBaseUrl,
  getOtpApiKey,
  getOtpAppId,
  getOtpBrandId,
} from '../lib/otpConfig';
import { normalizePhoneForOtp, maskMobileNumber } from '../utils/phoneNumber';
import {
  getProfileMobileNumber,
  getRecoveryMobileByEmail,
  completePasswordRecovery,
} from './profileService';

export type OtpActionResponse = {
  success: boolean;
  message: string;
  expiresIn?: number;
  requestId?: string;
  maskedPhone?: string;
};

type ProviderResponse = {
  success?: boolean;
  message?: string;
  expiresIn?: number;
  requestId?: string;
};

type PhoneContext = {
  phone: string;
  maskedPhone: string;
};

async function resolvePhone(
  mode: OtpMode,
  options?: { userId?: string; email?: string }
): Promise<PhoneContext> {
  let rawMobile: string | null = null;

  if (mode === 'recovery') {
    const email = options?.email?.trim().toLowerCase();
    if (!email) {
      throw new Error('Registered email address is required.');
    }
    rawMobile = await getRecoveryMobileByEmail(email);
  } else {
    const userId = options?.userId;
    if (!userId) {
      throw new Error('Please sign in to verify your mobile number.');
    }
    rawMobile = await getProfileMobileNumber(userId);
  }

  if (!rawMobile) {
    throw new Error('Registered mobile number not found.');
  }

  const phone = normalizePhoneForOtp(rawMobile);
  return {
    phone,
    maskedPhone: maskMobileNumber(rawMobile),
  };
}

async function callElvatechOtp(
  path: 'send' | 'resend' | 'verify',
  phone: string,
  otp?: string
): Promise<OtpActionResponse> {
  const payload: Record<string, string> = {
    appId: getOtpAppId(),
    apiKey: getOtpApiKey(),
    brandId: getOtpBrandId(),
    phone,
  };

  if (path === 'verify') {
    if (!otp) {
      throw new Error('OTP is required.');
    }
    payload.otp = otp;
  }

  const response = await fetch(`${getOtpApiBaseUrl()}/otp/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let body: ProviderResponse;
  try {
    body = (await response.json()) as ProviderResponse;
  } catch {
    throw new Error('Unexpected response from OTP service.');
  }

  if (!response.ok || body.success === false) {
    throw new Error(body.message ?? `OTP request failed (${response.status}).`);
  }

  return {
    success: true,
    message: body.message ?? 'Success',
    expiresIn: body.expiresIn ?? 300,
    requestId: body.requestId,
  };
}

export async function sendOtp(options?: {
  mode?: OtpMode;
  email?: string;
  userId?: string;
}): Promise<OtpActionResponse> {
  const mode = options?.mode ?? 'registration';
  const phoneContext = await resolvePhone(mode, {
    email: options?.email,
    userId: options?.userId,
  });

  const response = await callElvatechOtp('send', phoneContext.phone);
  return {
    ...response,
    maskedPhone: phoneContext.maskedPhone,
  };
}

export async function resendOtp(options?: {
  mode?: OtpMode;
  email?: string;
  userId?: string;
}): Promise<OtpActionResponse> {
  const mode = options?.mode ?? 'registration';
  const phoneContext = await resolvePhone(mode, {
    email: options?.email,
    userId: options?.userId,
  });

  const response = await callElvatechOtp('resend', phoneContext.phone);
  return {
    ...response,
    maskedPhone: phoneContext.maskedPhone,
  };
}

export async function verifyOtp(
  otp: string,
  options?: { mode?: OtpMode; email?: string; userId?: string }
): Promise<OtpActionResponse> {
  const cleaned = otp.replace(/\D/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    throw new Error('Please enter a valid 6-digit OTP.');
  }

  const mode = options?.mode ?? 'registration';
  const phoneContext = await resolvePhone(mode, {
    email: options?.email,
    userId: options?.userId,
  });

  return callElvatechOtp('verify', phoneContext.phone, cleaned);
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string
): Promise<OtpActionResponse> {
  await verifyOtp(otp, { mode: 'recovery', email });
  await completePasswordRecovery(email, newPassword);

  return {
    success: true,
    message: 'Password updated successfully.',
  };
}

import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  getOtpApiBaseUrl,
  getOtpApiKey,
  getOtpAppId,
  getOtpBrandId,
  isDirectOtpConfigured,
} from '../lib/otpConfig';
import { OtpMode } from '../types/otp';
import { normalizePhoneForOtp, maskMobileNumber } from '../utils/phoneNumber';
import {
  completeMpinRecovery,
  completePasswordRecovery,
  getProfileMobileNumber,
  getRecoveryMobileByEmail,
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

type EdgeOtpBody = {
  action: 'completePasswordReset';
  mode?: OtpMode;
  email?: string;
  newPassword?: string;
};

const EMAIL_RECOVERY_MODES: OtpMode[] = [
  'forgotMpin',
  'changeMpin',
  'forgotPassword',
  'changePassword',
];

async function resolvePhone(
  mode: OtpMode,
  options?: { userId?: string; email?: string; mobileNumber?: string }
): Promise<PhoneContext> {
  let rawMobile: string | null = null;

  if (EMAIL_RECOVERY_MODES.includes(mode)) {
    const email = options?.email?.trim().toLowerCase();
    if (!email) {
      throw new Error('Registered email address is required.');
    }
    rawMobile = await getRecoveryMobileByEmail(email);
  } else if (options?.mobileNumber?.trim()) {
    rawMobile = options.mobileNumber.trim();
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

  // Require an explicit success flag — some provider responses are HTTP 200
  // with success omitted/false while no SMS is actually delivered.
  if (!response.ok || body.success !== true) {
    throw new Error(
      body.message?.trim() ||
        `OTP request failed (${response.status}). Please try again.`
    );
  }

  return {
    success: true,
    message: body.message?.trim() || 'OTP sent successfully',
    expiresIn: body.expiresIn ?? 300,
    requestId: body.requestId,
  };
}

async function readEdgeFunctionErrorMessage(
  error: FunctionsHttpError
): Promise<string> {
  try {
    const body = (await error.context.json()) as { message?: string };
    if (body?.message) {
      return body.message;
    }
  } catch {
    // Fall through to generic message.
  }

  return error.message;
}

async function invokePasswordResetEdgeFunction(
  body: EdgeOtpBody
): Promise<OtpActionResponse> {
  const { data, error } = await supabase.functions.invoke<OtpActionResponse>(
    'otp',
    { body }
  );

  if (error) {
    if (error instanceof FunctionsHttpError) {
      throw new Error(await readEdgeFunctionErrorMessage(error));
    }

    if (error.message?.includes('Requested function was not found')) {
      throw new Error('OTP edge function is not deployed.');
    }

    throw new Error(error.message ?? 'Password reset request failed.');
  }

  if (!data?.success) {
    throw new Error(data?.message ?? 'Password reset request failed.');
  }

  return {
    success: true,
    message: data.message ?? 'Password updated successfully.',
  };
}

function isRpcUnavailable(message: string): boolean {
  return (
    message.includes('008_otp_recovery') ||
    message.includes('022_mpin') ||
    message.includes('023_split') ||
    message.includes('Requested function was not found') ||
    (message.includes('function') && message.includes('not found'))
  );
}

export async function sendOtp(options?: {
  mode?: OtpMode;
  email?: string;
  userId?: string;
  mobileNumber?: string;
}): Promise<OtpActionResponse> {
  const mode = options?.mode ?? 'registration';
  const phoneContext = await resolvePhone(mode, {
    email: options?.email,
    userId: options?.userId,
    mobileNumber: options?.mobileNumber,
  });

  if (!isDirectOtpConfigured()) {
    throw new Error(
      'OTP is not configured. Add EXPO_PUBLIC_OTP_API_KEY to .env and restart Expo.'
    );
  }

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
  mobileNumber?: string;
}): Promise<OtpActionResponse> {
  const mode = options?.mode ?? 'registration';
  const phoneContext = await resolvePhone(mode, {
    email: options?.email,
    userId: options?.userId,
    mobileNumber: options?.mobileNumber,
  });

  if (!isDirectOtpConfigured()) {
    throw new Error(
      'OTP is not configured. Add EXPO_PUBLIC_OTP_API_KEY to .env and restart Expo.'
    );
  }

  // Prefer a fresh /otp/send. Provider /otp/resend often only retries an
  // existing session — if the first SMS never delivered, resend keeps failing.
  try {
    const response = await callElvatechOtp('send', phoneContext.phone);
    return {
      ...response,
      message: response.message || 'OTP resent successfully',
      maskedPhone: phoneContext.maskedPhone,
    };
  } catch (sendError) {
    try {
      const response = await callElvatechOtp('resend', phoneContext.phone);
      return {
        ...response,
        maskedPhone: phoneContext.maskedPhone,
      };
    } catch {
      throw sendError instanceof Error
        ? sendError
        : new Error('Failed to resend OTP.');
    }
  }
}

export async function verifyOtp(
  otp: string,
  options?: {
    mode?: OtpMode;
    email?: string;
    userId?: string;
    mobileNumber?: string;
  }
): Promise<OtpActionResponse> {
  const cleaned = otp.replace(/\D/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    throw new Error('Please enter a valid 6-digit OTP.');
  }

  const mode = options?.mode ?? 'registration';
  const phoneContext = await resolvePhone(mode, {
    email: options?.email,
    userId: options?.userId,
    mobileNumber: options?.mobileNumber,
  });

  if (!isDirectOtpConfigured()) {
    throw new Error(
      'OTP is not configured. Add EXPO_PUBLIC_OTP_API_KEY to .env and restart Expo.'
    );
  }

  return callElvatechOtp('verify', phoneContext.phone, cleaned);
}

export async function completeMpinReset(
  email: string,
  newMpin: string
): Promise<OtpActionResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    await completeMpinRecovery(normalizedEmail, newMpin);
    return {
      success: true,
      message: 'MPIN updated successfully.',
    };
  } catch (rpcError) {
    const rpcMessage =
      rpcError instanceof Error ? rpcError.message : 'MPIN reset failed.';

    if (!isRpcUnavailable(rpcMessage)) {
      throw rpcError instanceof Error ? rpcError : new Error(rpcMessage);
    }

    // Legacy edge fallback (may still write Auth password — prefer migration 023).
    return invokePasswordResetEdgeFunction({
      action: 'completePasswordReset',
      mode: 'forgotMpin',
      email: normalizedEmail,
      newPassword: newMpin,
    });
  }
}

export async function completePasswordReset(
  email: string,
  newPassword: string
): Promise<OtpActionResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    await completePasswordRecovery(normalizedEmail, newPassword);
    return {
      success: true,
      message: 'Password updated successfully.',
    };
  } catch (rpcError) {
    const rpcMessage =
      rpcError instanceof Error ? rpcError.message : 'Password reset failed.';

    if (!isRpcUnavailable(rpcMessage)) {
      throw rpcError instanceof Error ? rpcError : new Error(rpcMessage);
    }

    return invokePasswordResetEdgeFunction({
      action: 'completePasswordReset',
      mode: 'forgotPassword',
      email: normalizedEmail,
      newPassword,
    });
  }
}

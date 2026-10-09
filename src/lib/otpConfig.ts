import Constants from 'expo-constants';

type OtpExtraConfig = {
  otpApiBaseUrl?: string;
  otpAppId?: string;
  otpApiKey?: string;
  otpBrandId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as OtpExtraConfig;

const PLACEHOLDER_KEYS = new Set(['', 'your_otp_api_key', 'changeme']);

function readOtpValue(
  extraValue: string | undefined,
  envName: string
): string | undefined {
  const fromExtra = extraValue?.trim();
  if (fromExtra) {
    return fromExtra;
  }
  const fromEnv = process.env[envName]?.trim();
  return fromEnv || undefined;
}

function readOtpApiKey(): string | undefined {
  const key = readOtpValue(extra.otpApiKey, 'EXPO_PUBLIC_OTP_API_KEY');
  if (!key || PLACEHOLDER_KEYS.has(key)) {
    return undefined;
  }
  return key;
}

export function getOtpApiBaseUrl(): string {
  return (
    readOtpValue(extra.otpApiBaseUrl, 'EXPO_PUBLIC_OTP_API_BASE_URL') ||
    'https://api.notify.elvatech.in'
  );
}

export function getOtpAppId(): string {
  return readOtpValue(extra.otpAppId, 'EXPO_PUBLIC_OTP_APP_ID') || 'eNandi';
}

export function getOtpApiKey(): string {
  const key = readOtpApiKey();
  if (!key) {
    throw new Error(
      'OTP is not configured. Add EXPO_PUBLIC_OTP_API_KEY to .env and restart Expo with -c.'
    );
  }
  return key;
}

export function getOtpBrandId(): string {
  return (
    readOtpValue(extra.otpBrandId, 'EXPO_PUBLIC_OTP_BRAND_ID') || 'elva-sales'
  );
}

export function isDirectOtpConfigured(): boolean {
  return Boolean(readOtpApiKey());
}

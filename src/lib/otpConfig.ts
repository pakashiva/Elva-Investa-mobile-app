import Constants from 'expo-constants';

type OtpExtraConfig = {
  otpApiBaseUrl?: string;
  otpAppId?: string;
  otpApiKey?: string;
  otpBrandId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as OtpExtraConfig;

export function getOtpApiBaseUrl(): string {
  return extra.otpApiBaseUrl?.trim() || 'https://api.notify.elvatech.in';
}

export function getOtpAppId(): string {
  return extra.otpAppId?.trim() || 'eNandi';
}

export function getOtpApiKey(): string {
  const key = extra.otpApiKey?.trim();
  if (!key) {
    throw new Error(
      'Missing OTP API key. Add EXPO_PUBLIC_OTP_API_KEY to your .env file.'
    );
  }
  return key;
}

export function getOtpBrandId(): string {
  return extra.otpBrandId?.trim() || 'elva-sales';
}

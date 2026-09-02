import Constants from 'expo-constants';

type ExtraConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export function getSupabaseUrl(): string {
  const url = extra.supabaseUrl?.trim();
  if (!url) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL. Add it to your .env file.'
    );
  }
  return url;
}

export function getSupabasePublishableKey(): string {
  const key = extra.supabasePublishableKey?.trim();
  if (!key) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add it to your .env file.'
    );
  }
  return key;
}

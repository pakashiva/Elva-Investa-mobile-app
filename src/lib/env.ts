import Constants from 'expo-constants';

type ExtraConfig = {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function readEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) {
    return fromProcess;
  }
  return undefined;
}

export function getSupabaseUrl(): string {
  const url =
    readEnv('EXPO_PUBLIC_SUPABASE_URL') ??
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ??
    extra.supabaseUrl?.trim();

  if (!url) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL. Add it to your .env file and restart Expo with -c.'
    );
  }
  return url;
}

export function getSupabasePublishableKey(): string {
  const key =
    readEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
    readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
    extra.supabasePublishableKey?.trim();

  if (!key) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add it to your .env file and restart Expo with -c.'
    );
  }

  // Guard against a truncated key (common copy/paste mistake).
  if (!key.startsWith('sb_publishable_') && !key.startsWith('eyJ')) {
    throw new Error(
      'Supabase key format looks wrong. Use the publishable key (sb_publishable_...) or legacy anon JWT from the Supabase dashboard.'
    );
  }
  if (key.startsWith('sb_publishable_') && key.length < 40) {
    throw new Error(
      'Supabase publishable key looks truncated. Paste the full key from Supabase → Project Settings → API Keys.'
    );
  }

  return key;
}

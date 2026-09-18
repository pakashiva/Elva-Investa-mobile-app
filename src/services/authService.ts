import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { normalizeMobileDigits } from '../utils/indianValidators';
import {
  clearUnlockWindow,
  extendUnlockWindow,
} from './sessionUnlockStore';

export type AuthResult = {
  session: Session | null;
};

function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Invalid mobile/email or password. Please try again.';
  }
  if (lower.includes('invalid api key') || lower.includes('invalid jwt')) {
    return (
      'Supabase API key is invalid or outdated. Update EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env, then run: npx expo start -c'
    );
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered')
  ) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return (
      'Too many attempts were made recently. Please wait a few minutes and try again.'
    );
  }
  return message;
}

export async function resolveLoginEmailFromMobile(
  mobile: string
): Promise<string> {
  const digits = normalizeMobileDigits(mobile);
  if (!digits || digits.length !== 10) {
    throw new Error('Enter a valid 10-digit mobile number.');
  }

  const { data, error } = await supabase.rpc('get_login_email_by_mobile', {
    p_mobile: digits,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== 'string') {
    throw new Error('No account found for this mobile number.');
  }

  return data.trim().toLowerCase();
}

export async function resolveLoginEmail(mobileOrEmail: string): Promise<string> {
  const trimmed = mobileOrEmail.trim();
  if (!trimmed) {
    throw new Error('Please enter your mobile number or email.');
  }
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return resolveLoginEmailFromMobile(trimmed);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (
      lower.includes('user already registered') ||
      lower.includes('already been registered') ||
      lower.includes('user_already_exists')
    ) {
      try {
        return await signInWithEmail(normalizedEmail, password);
      } catch {
        throw new Error(
          'This email is already registered in Supabase Auth (even if app tables were cleared). Delete the user under Authentication → Users in the Supabase dashboard, or sign in / use Forgot Password.'
        );
      }
    }
    throw new Error(formatAuthError(error.message));
  }

  // Supabase returns a fake user with empty identities when the email already
  // exists and email confirmation is enabled — do not treat as a new signup.
  const identities = data.user?.identities ?? [];
  if (data.user && identities.length === 0) {
    try {
      return await signInWithEmail(normalizedEmail, password);
    } catch {
      throw new Error(
        'This email is already registered in Supabase Auth (even if app tables were cleared). Delete the user under Authentication → Users in the Supabase dashboard, or sign in / use Forgot Password.'
      );
    }
  }

  if (data.session) {
    return { session: data.session };
  }

  // New user created but no session → email confirmation is still enabled.
  throw new Error(
    'Account was created but no active session is available. In Supabase Dashboard → Authentication → Providers → Email, turn OFF "Confirm email", then try registering again (and delete any half-created Auth user first).'
  );
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(formatAuthError(error.message));
  }

  if (data.session?.user?.id) {
    await extendUnlockWindow(data.session.user.id);
  }

  return { session: data.session };
}

export async function signInWithMobileOrEmail(
  mobileOrEmail: string,
  password: string
): Promise<AuthResult> {
  const email = await resolveLoginEmail(mobileOrEmail);
  return signInWithEmail(email, password);
}

export async function setOwnMpin(mpin: string): Promise<void> {
  const { error } = await supabase.rpc('set_own_mpin', { p_mpin: mpin });
  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyOwnMpin(mpin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_own_mpin', {
    p_mpin: mpin,
  });
  if (error) {
    throw new Error(error.message);
  }
  return Boolean(data);
}

/** Unlock with MPIN when Supabase session is still valid; extends 15-day window. */
export async function unlockWithMpin(mpin: string): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message);
  }
  if (!session?.user?.id) {
    throw new Error('Session expired. Please sign in with your password.');
  }

  const ok = await verifyOwnMpin(mpin);
  if (!ok) {
    throw new Error('Incorrect MPIN. Please try again.');
  }

  // Refresh Auth tokens and extend local unlock window.
  await supabase.auth.refreshSession();
  await extendUnlockWindow(session.user.id);
}

export async function signOut(): Promise<void> {
  await clearUnlockWindow();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

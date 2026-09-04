import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthResult = {
  session: Session | null;
};

function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Invalid mobile/email or password. Please try again.';
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
      'Too many registration attempts were made recently. Please wait a few minutes and try again. ' +
      'If you are testing, use a new email address or increase Auth rate limits in your Supabase dashboard ' +
      '(Authentication → Rate Limits).'
    );
  }
  return message;
}

function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

export async function resolveLoginEmail(mobileOrEmail: string): Promise<string> {
  const trimmed = mobileOrEmail.trim();
  if (!trimmed) {
    throw new Error('Please enter your mobile number or email address.');
  }

  if (looksLikeEmail(trimmed)) {
    return trimmed.toLowerCase();
  }

  const { data, error } = await supabase.rpc('get_login_email_by_mobile', {
    p_mobile: trimmed,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== 'string') {
    throw new Error(
      'No account found for this mobile number. Try your email address instead.'
    );
  }

  return data.trim().toLowerCase();
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
      lower.includes('already been registered')
    ) {
      return signInWithEmail(normalizedEmail, password);
    }
    throw new Error(formatAuthError(error.message));
  }

  if (data.session) {
    return { session: data.session };
  }

  const signInResult = await signInWithEmail(normalizedEmail, password);
  return signInResult;
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

  return { session: data.session };
}

export async function signInWithMobileOrEmail(
  mobileOrEmail: string,
  password: string
): Promise<AuthResult> {
  const email = await resolveLoginEmail(mobileOrEmail);
  return signInWithEmail(email, password);
}

export async function signOut(): Promise<void> {
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

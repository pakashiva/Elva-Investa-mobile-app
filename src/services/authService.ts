import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthResult = {
  session: Session | null;
};

function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
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

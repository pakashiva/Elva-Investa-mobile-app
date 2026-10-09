import { AppSession, CustomerPayload } from '../types/auth';
import { apiRequest } from '../lib/api';
import { normalizeMobileDigits } from '../utils/indianValidators';
import { saveMpin, verifyStoredMpin } from './mpinStore';
import {
  clearStoredSession,
  getStoredSession,
  persistSession,
} from './sessionStore';
import {
  clearUnlockWindow,
  extendUnlockWindow,
} from './sessionUnlockStore';

export type AuthResult = {
  session: AppSession | null;
};

type AuthResponse = {
  token: string;
  customer: CustomerPayload;
};

export async function resolveLoginEmail(mobileOrEmail: string): Promise<string> {
  const trimmed = mobileOrEmail.trim();
  if (!trimmed) {
    throw new Error('Please enter your mobile number or email.');
  }
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const digits = normalizeMobileDigits(trimmed);
  if (digits.length !== 10) {
    throw new Error('Enter a valid 10-digit mobile number.');
  }
  return digits;
}

function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid mobile') || lower.includes('invalid login')) {
    return 'Invalid mobile/email, password, or client code. Please try again.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts were made recently. Please wait a few minutes and try again.';
  }
  return message;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  return signInWithMobileOrEmail(email, password);
}

export async function signInWithMobileOrEmail(
  mobileOrEmail: string,
  password: string,
  clientCode?: string
): Promise<AuthResult> {
  const identifier = mobileOrEmail.trim();
  const traderCode = clientCode?.trim().toUpperCase() ?? '';
  if (!identifier) {
    throw new Error('Please enter your mobile number or email.');
  }
  if (!identifier.includes('@')) {
    const digits = normalizeMobileDigits(identifier);
    if (digits.length !== 10) {
      throw new Error('Enter a valid 10-digit mobile number.');
    }
  }
  if (!/^[A-Z0-9]{3,20}$/.test(traderCode)) {
    throw new Error('Enter the client code of the trader you registered with.');
  }

  try {
    const data = await apiRequest<AuthResponse>('/api/mobile/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        mobileOrEmail: identifier,
        password,
        clientCode: traderCode,
      }),
    });
    const session = await persistSession(data.token, data.customer);
    await extendUnlockWindow(session.user.id);
    return { session };
  } catch (error) {
    throw new Error(
      formatAuthError(error instanceof Error ? error.message : 'Sign in failed.')
    );
  }
}

export async function setOwnMpin(mpin: string): Promise<void> {
  const session = await getStoredSession();
  if (!session?.customer?.id) {
    throw new Error('Please sign in before setting an MPIN.');
  }
  await saveMpin({
    customerId: session.customer.id,
    email: session.customer.emailAddress,
    mpin,
  });
}

export async function verifyOwnMpin(mpin: string): Promise<boolean> {
  const session = await getStoredSession();
  if (!session?.customer) {
    return false;
  }
  return verifyStoredMpin({
    customerId: session.customer.id,
    email: session.customer.emailAddress,
    mpin,
  });
}

export async function unlockWithMpin(mpin: string): Promise<void> {
  const session = await getStoredSession();
  if (!session?.user?.id) {
    throw new Error('Session expired. Please sign in with your password.');
  }

  const ok = await verifyOwnMpin(mpin);
  if (!ok) {
    throw new Error('Incorrect MPIN. Please try again.');
  }

  await extendUnlockWindow(session.user.id);
}

export async function signOut(): Promise<void> {
  await clearUnlockWindow();
  await clearStoredSession();
}

export async function getCurrentSession(): Promise<AppSession | null> {
  return getStoredSession();
}

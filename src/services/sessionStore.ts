import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSession, CustomerPayload } from '../types/auth';

const TOKEN_KEY = 'elva_customer_token';
const SESSION_KEY = 'elva_customer_session';

type SessionListener = (session: AppSession | null) => void;

const listeners = new Set<SessionListener>();

function emit(session: AppSession | null) {
  listeners.forEach((listener) => listener(session));
}

export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function buildSession(
  token: string,
  customer: CustomerPayload
): AppSession {
  return {
    access_token: token,
    user: {
      id: customer.id,
      email: customer.emailAddress,
      last_sign_in_at: new Date().toISOString(),
    },
    customer,
  };
}

export async function persistSession(
  token: string,
  customer: CustomerPayload
): Promise<AppSession> {
  const session = buildSession(token, customer);
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [SESSION_KEY, JSON.stringify(session)],
  ]);
  emit(session);
  return session;
}

export async function getStoredToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return token?.trim() || null;
}

export async function getStoredSession(): Promise<AppSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AppSession;
    if (!parsed?.access_token || !parsed?.user?.id || !parsed.customer?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, SESSION_KEY]);
  emit(null);
}

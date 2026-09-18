import AsyncStorage from '@react-native-async-storage/async-storage';

/** App unlock window after credential login / each successful MPIN (days). */
export const SESSION_UNLOCK_DAYS = 15;

const KEY_EXPIRES_AT = 'app_unlock_expires_at';
const KEY_USER_ID = 'app_unlock_user_id';

export async function getUnlockExpiresAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(KEY_EXPIRES_AT);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function getUnlockUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_USER_ID);
}

export async function isUnlockWindowValid(userId: string): Promise<boolean> {
  const [expiresAt, storedUserId] = await Promise.all([
    getUnlockExpiresAt(),
    getUnlockUserId(),
  ]);
  if (!expiresAt || !storedUserId || storedUserId !== userId) {
    return false;
  }
  return Date.now() < expiresAt;
}

export async function extendUnlockWindow(userId: string): Promise<number> {
  const expiresAt =
    Date.now() + SESSION_UNLOCK_DAYS * 24 * 60 * 60 * 1000;
  await AsyncStorage.multiSet([
    [KEY_EXPIRES_AT, String(expiresAt)],
    [KEY_USER_ID, userId],
  ]);
  return expiresAt;
}

export async function clearUnlockWindow(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_EXPIRES_AT, KEY_USER_ID]);
}

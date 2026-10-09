import AsyncStorage from '@react-native-async-storage/async-storage';

function idKey(customerId: string): string {
  return `elva_mpin:${customerId}`;
}

function emailKey(email: string): string {
  return `elva_mpin_email:${email.trim().toLowerCase()}`;
}

export async function saveMpin(options: {
  customerId?: string | null;
  email?: string | null;
  mpin: string;
}): Promise<void> {
  const pairs: [string, string][] = [];
  if (options.customerId) {
    pairs.push([idKey(options.customerId), options.mpin]);
  }
  if (options.email) {
    pairs.push([emailKey(options.email), options.mpin]);
  }
  if (pairs.length === 0) {
    throw new Error('Unable to save MPIN for this account.');
  }
  await AsyncStorage.multiSet(pairs);
}

export async function verifyStoredMpin(options: {
  customerId?: string | null;
  email?: string | null;
  mpin: string;
}): Promise<boolean> {
  const keys: string[] = [];
  if (options.customerId) {
    keys.push(idKey(options.customerId));
  }
  if (options.email) {
    keys.push(emailKey(options.email));
  }
  if (keys.length === 0) {
    return false;
  }
  const values = await AsyncStorage.multiGet(keys);
  return values.some(([, value]) => value === options.mpin);
}

export async function hasStoredMpin(options: {
  customerId?: string | null;
  email?: string | null;
}): Promise<boolean> {
  const keys: string[] = [];
  if (options.customerId) {
    keys.push(idKey(options.customerId));
  }
  if (options.email) {
    keys.push(emailKey(options.email));
  }
  if (keys.length === 0) {
    return false;
  }
  const values = await AsyncStorage.multiGet(keys);
  return values.some(([, value]) => Boolean(value));
}

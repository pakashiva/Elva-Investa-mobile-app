import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistrationFormValues } from '../types/registrationForm';

const PENDING_KEY_PREFIX = 'pending_registration:';

export async function savePendingRegistration(
  userId: string,
  form: RegistrationFormValues
): Promise<void> {
  await AsyncStorage.setItem(
    `${PENDING_KEY_PREFIX}${userId}`,
    JSON.stringify(form)
  );
}

export async function loadPendingRegistration(
  userId: string
): Promise<RegistrationFormValues | null> {
  const raw = await AsyncStorage.getItem(`${PENDING_KEY_PREFIX}${userId}`);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as RegistrationFormValues;
  } catch {
    return null;
  }
}

export async function clearPendingRegistration(userId: string): Promise<void> {
  await AsyncStorage.removeItem(`${PENDING_KEY_PREFIX}${userId}`);
}

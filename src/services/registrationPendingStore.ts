import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistrationFormValues } from '../types/registrationForm';

const SIGNUP_KEY = 'pending_registration:signup';

export async function savePendingRegistration(
  form: RegistrationFormValues,
  _userId?: string
): Promise<void> {
  await AsyncStorage.setItem(SIGNUP_KEY, JSON.stringify(form));
}

export async function loadPendingRegistration(
  _userId?: string
): Promise<RegistrationFormValues | null> {
  const raw = await AsyncStorage.getItem(SIGNUP_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as RegistrationFormValues;
  } catch {
    return null;
  }
}

export async function clearPendingRegistration(_userId?: string): Promise<void> {
  await AsyncStorage.removeItem(SIGNUP_KEY);
}

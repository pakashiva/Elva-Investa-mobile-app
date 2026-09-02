import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { getSupabasePublishableKey, getSupabaseUrl } from './env';
import type { Database } from '../types/database';

export const supabase = createClient<Database>(
  getSupabaseUrl(),
  getSupabasePublishableKey(),
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

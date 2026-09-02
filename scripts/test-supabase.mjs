/**
 * Smoke test for Supabase registration integration.
 * Run: node scripts/test-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (!process.env[key]) {
        process.env[key] = rest.join('=');
      }
    }
  } catch {
    // .env optional for CI
  }
}

loadEnv();

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(url, key);

const testEmail = `test+${Date.now()}@example.com`;
const testPassword = 'TestPass1!';

async function main() {
  console.log('Checking profiles table...');
  const tableCheck = await supabase.from('profiles').select('user_id').limit(1);
  if (tableCheck.error) {
    console.error('profiles table check failed:', tableCheck.error.message);
    console.error(
      'Run supabase/migrations/001_registration_schema.sql in the Supabase SQL Editor first.'
    );
    process.exit(1);
  }

  console.log('Signing up test user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: { data: { full_name: 'Test User' } },
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    process.exit(1);
  }

  const userId = signUpData.user?.id;
  const session = signUpData.session;

  if (!userId || !session) {
    console.error(
      'Sign up succeeded but no session returned. Disable email confirmation in Supabase Auth settings.'
    );
    process.exit(1);
  }

  console.log('Inserting profile row...');
  const profileInsert = await supabase.from('profiles').insert({
    user_id: userId,
    full_name: 'Test User',
    mobile_number: '+91 9000000000',
    email_address: testEmail,
    date_of_birth: '1990-01-01',
    address: 'Test Address',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin_code: '560001',
    authorized: true,
  });

  if (profileInsert.error) {
    console.error('Profile insert failed:', profileInsert.error.message);
    process.exit(1);
  }

  console.log('Registration smoke test passed for', testEmail);
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

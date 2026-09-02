/**
 * Tests phone normalization and mobile_verified profile behavior.
 * Run: node scripts/test-otp-flow.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=');
  }
}

loadEnv();

function normalizePhoneForOtp(mobile) {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('91')) return digits;
  return `91${digits}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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

async function main() {
  console.log('1. Phone normalization...');
  assert(normalizePhoneForOtp('9876543210') === '919876543210', '10-digit');
  assert(normalizePhoneForOtp('919876543210') === '919876543210', 'already prefixed');
  assert(normalizePhoneForOtp('+91 9876543210') === '919876543210', 'formatted input');

  console.log('2. Create unverified user profile...');
  const email = `otpflow+${Date.now()}@example.com`;
  const signUp = await supabase.auth.signUp({
    email,
    password: 'TestPass1!',
  });
  if (signUp.error) throw new Error(signUp.error.message);
  const userId = signUp.data.user?.id;
  if (!userId || !signUp.data.session) {
    throw new Error('No session — disable email confirmation.');
  }

  const insert = await supabase.from('profiles').insert({
    user_id: userId,
    full_name: 'OTP Flow Test',
    mobile_number: '9876543210',
    email_address: email,
    date_of_birth: '1990-01-01',
    address: 'Test',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin_code: '560001',
    authorized: true,
    mobile_verified: false,
  }).select('mobile_number, mobile_verified').single();

  if (insert.error) {
    if (insert.error.message.includes('mobile_verified')) {
      console.error('Apply migration 007_mobile_verified.sql first.');
      process.exit(1);
    }
    throw new Error(insert.error.message);
  }

  assert(insert.data.mobile_verified === false, 'Should start unverified');

  console.log('3. Client cannot set mobile_verified directly...');
  const blocked = await supabase
    .from('profiles')
    .update({ mobile_verified: true })
    .eq('user_id', userId);
  assert(blocked.error, 'Authenticated client update should be blocked');

  console.log('4. User isolation on profile mobile number...');
  await supabase.auth.signOut();
  const emailB = `otpflowb+${Date.now()}@example.com`;
  const signUpB = await supabase.auth.signUp({
    email: emailB,
    password: 'TestPass1!',
  });
  if (signUpB.error) throw new Error(signUpB.error.message);
  const userB = signUpB.data.user?.id;
  if (!userB || !signUpB.data.session) throw new Error('No session for user B');

  const crossRead = await supabase
    .from('profiles')
    .select('mobile_number')
    .eq('user_id', userId);
  assert((crossRead.data ?? []).length === 0, 'User B must not read User A profile');

  console.log('\nOTP flow database checks passed.');
  console.log('Deploy the otp edge function and set OTP_API_KEY to test live send/verify.');
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error('\nTest failed:', error.message);
  process.exit(1);
});

/**
 * Verifies withdrawal Approved → investment Closed trigger.
 *
 * 1. Creates data via Supabase Auth client (anon key)
 * 2. Updates withdrawal status via Postgres (simulates admin portal)
 *
 * Requires:
 * - EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * - SUPABASE_DB_URL (Postgres connection string)
 * - Migration 003 applied
 *
 * Run: node scripts/test-withdrawal-trigger.mjs
 */
import pg from 'pg';
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

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const connectionString = process.env.SUPABASE_DB_URL;

if (!url || !key || !connectionString) {
  console.error(
    'Need EXPO_PUBLIC_SUPABASE_* and SUPABASE_DB_URL in .env for trigger test.'
  );
  process.exit(1);
}

const supabase = createClient(url, key);
const pgClient = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const testEmail = `trigger+${Date.now()}@example.com`;
const testPassword = 'TestPass1!';

await pgClient.connect();

try {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  assert(!signUpError, signUpError?.message ?? 'sign up failed');

  const userId = signUpData.user?.id;
  const session = signUpData.session;
  assert(userId && session, 'No session — disable email confirmation in Supabase Auth.');

  await supabase.from('profiles').insert({
    user_id: userId,
    full_name: 'Trigger Test User',
    mobile_number: '+91 9222222222',
    email_address: testEmail,
    date_of_birth: '1990-01-01',
    address: 'Test',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin_code: '560001',
    authorized: true,
  });

  const bank = await supabase
    .from('bank_accounts')
    .insert({
      user_id: userId,
      account_holder_name: 'Trigger Test User',
      account_number: '5555666677',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      is_primary: true,
    })
    .select('id')
    .single();
  assert(!bank.error, bank.error?.message ?? 'bank insert failed');

  const nominee = await supabase
    .from('nominees')
    .insert({
      user_id: userId,
      nominee_name: 'Trigger Nominee',
      relationship: 'Spouse',
      nominee_aadhaar: '999988887777',
      nominee_percentage: '100',
    })
    .select('id')
    .single();
  assert(!nominee.error, nominee.error?.message ?? 'nominee insert failed');

  const active = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 200000,
      bank_account_id: bank.data.id,
      nominee_id: nominee.data.id,
      pay_date: '2026-01-01',
      status: 'Active',
      name: 'Trigger Active Fund',
      current_value: 220000,
    })
    .select('id, status')
    .single();
  assert(!active.error, active.error?.message ?? 'active investment insert failed');

  const pending = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 100000,
      bank_account_id: bank.data.id,
      nominee_id: nominee.data.id,
      pay_date: '2026-01-01',
      status: 'Pending',
      name: 'Trigger Pending Fund',
      current_value: 100000,
    })
    .select('id, status')
    .single();
  assert(!pending.error, pending.error?.message ?? 'pending investment insert failed');

  const withdrawal = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      investment_id: active.data.id,
      bank_account_id: bank.data.id,
      withdrawal_amount: 220000,
      strategy: 'full',
      status: 'Processing',
    })
    .select('id')
    .single();
  assert(!withdrawal.error, withdrawal.error?.message ?? 'withdrawal insert failed');

  await pgClient.query(
    `UPDATE public.withdrawals SET status = 'Approved' WHERE id = $1`,
    [withdrawal.data.id]
  );

  const activeAfter = await pgClient.query(
    `SELECT status FROM public.investments WHERE id = $1`,
    [active.data.id]
  );
  assert(
    activeAfter.rows[0].status === 'Closed',
    'Active investment should become Closed after withdrawal Approved'
  );

  const pendingAfter = await pgClient.query(
    `SELECT status FROM public.investments WHERE id = $1`,
    [pending.data.id]
  );
  assert(
    pendingAfter.rows[0].status === 'Pending',
    'Unrelated Pending investment must remain Pending'
  );

  console.log('Withdrawal trigger test passed for', testEmail);
  await supabase.auth.signOut();
} finally {
  await pgClient.end();
}

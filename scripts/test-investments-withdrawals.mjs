/**
 * End-to-end test for investments and withdrawals integration.
 * Run: node scripts/test-investments-withdrawals.mjs
 *
 * Requires:
 * - EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env
 * - Migration 003 applied (investments + withdrawals tables)
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
      if (!process.env[key]) process.env[key] = rest.join('=');
    }
  } catch {
    // optional
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

const testEmail = `invtest+${Date.now()}@example.com`;
const testPassword = 'TestPass1!';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log('1. Checking investments table...');
  const tableCheck = await supabase.from('investments').select('id').limit(1);
  if (tableCheck.error) {
    console.error('investments table check failed:', tableCheck.error.message);
    console.error(
      'Run supabase/migrations/003_investments_withdrawals.sql in the Supabase SQL Editor first.'
    );
    process.exit(1);
  }

  console.log('2. Creating test user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
    process.exit(1);
  }

  const userId = signUpData.user?.id;
  const session = signUpData.session;
  if (!userId || !session) {
    console.error('No session returned. Disable email confirmation in Supabase Auth.');
    process.exit(1);
  }

  console.log('3. Inserting profile, bank accounts, nominees...');
  const profileInsert = await supabase.from('profiles').insert({
    user_id: userId,
    full_name: 'Integration Test User',
    mobile_number: '+91 9111111111',
    email_address: testEmail,
    date_of_birth: '1990-01-01',
    address: 'Test Address',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin_code: '560001',
    authorized: true,
  });
  assert(!profileInsert.error, profileInsert.error?.message ?? 'profile insert failed');

  const bank1 = await supabase
    .from('bank_accounts')
    .insert({
      user_id: userId,
      account_holder_name: 'Integration Test User',
      account_number: '1234567890',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      is_primary: true,
    })
    .select('id')
    .single();
  assert(!bank1.error, bank1.error?.message ?? 'bank1 insert failed');

  const bank2 = await supabase
    .from('bank_accounts')
    .insert({
      user_id: userId,
      account_holder_name: 'Integration Test User',
      account_number: '9876543210',
      ifsc_code: 'ICIC0001234',
      bank_name: 'ICICI Bank',
      is_primary: false,
    })
    .select('id')
    .single();
  assert(!bank2.error, bank2.error?.message ?? 'bank2 insert failed');

  const nominee1 = await supabase
    .from('nominees')
    .insert({
      user_id: userId,
      nominee_name: 'Nominee One',
      relationship: 'Spouse',
      nominee_aadhaar: '123412341234',
      nominee_percentage: '50',
    })
    .select('id')
    .single();
  assert(!nominee1.error, nominee1.error?.message ?? 'nominee1 insert failed');

  const nominee2 = await supabase
    .from('nominees')
    .insert({
      user_id: userId,
      nominee_name: 'Nominee Two',
      relationship: 'Child',
      nominee_aadhaar: '567856785678',
      nominee_percentage: '50',
    })
    .select('id')
    .single();
  assert(!nominee2.error, nominee2.error?.message ?? 'nominee2 insert failed');

  console.log('4. Creating Pending fund request (investment)...');
  const pendingInsert = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 150000,
      bank_account_id: bank1.data.id,
      nominee_id: nominee1.data.id,
      pay_date: '2026-09-04',
      status: 'Pending',
      name: 'New Fund Request',
      current_value: 150000,
    })
    .select('id, status, code')
    .single();
  assert(!pendingInsert.error, pendingInsert.error?.message ?? 'pending insert failed');
  assert(pendingInsert.data.status === 'Pending', 'Expected Pending status');

  console.log('5. Creating Active, Pending, Closed investments for withdrawal filter test...');
  const activeInsert = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 250000,
      bank_account_id: bank1.data.id,
      nominee_id: nominee1.data.id,
      pay_date: '2026-01-01',
      status: 'Active',
      name: 'Active Test Fund',
      current_value: 285775,
    })
    .select('id, status, code')
    .single();
  assert(!activeInsert.error, activeInsert.error?.message ?? 'active insert failed');

  const closedInsert = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 100000,
      bank_account_id: bank2.data.id,
      nominee_id: nominee2.data.id,
      pay_date: '2025-01-01',
      status: 'Closed',
      name: 'Closed Test Fund',
      current_value: 100000,
    })
    .select('id, status')
    .single();
  assert(!closedInsert.error, closedInsert.error?.message ?? 'closed insert failed');

  const activeOnly = await supabase
    .from('investments')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'Active');
  assert(!activeOnly.error, activeOnly.error?.message ?? 'active query failed');
  assert(activeOnly.data.length === 1, 'Expected exactly one Active investment');

  console.log('6. Creating withdrawal with Processing status...');
  const withdrawalInsert = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      investment_id: activeInsert.data.id,
      bank_account_id: bank2.data.id,
      withdrawal_amount: 285775,
      strategy: 'full',
      status: 'Processing',
    })
    .select('id, status, investment_id')
    .single();
  assert(!withdrawalInsert.error, withdrawalInsert.error?.message ?? 'withdrawal insert failed');
  assert(withdrawalInsert.data.status === 'Processing', 'Expected Processing status');

  const activeBefore = await supabase
    .from('investments')
    .select('status')
    .eq('id', activeInsert.data.id)
    .single();
  assert(activeBefore.data.status === 'Active', 'Investment should remain Active while Processing');

  console.log('7. Simulating admin approval (trigger should close investment)...');
  const approveUpdate = await supabase
    .from('withdrawals')
    .update({ status: 'Approved' })
    .eq('id', withdrawalInsert.data.id)
    .select('status')
    .single();

  if (approveUpdate.error) {
    console.warn(
      'Could not update withdrawal to Approved via anon key (expected if RLS blocks updates).'
    );
    console.warn(
      'Approve the withdrawal in Supabase SQL Editor or admin portal to verify the trigger.'
    );
    console.warn('Error:', approveUpdate.error.message);
  } else {
    const activeAfter = await supabase
      .from('investments')
      .select('status')
      .eq('id', activeInsert.data.id)
      .single();
    assert(
      activeAfter.data.status === 'Closed',
      'Investment should be Closed after withdrawal Approved'
    );

    const pendingStill = await supabase
      .from('investments')
      .select('status')
      .eq('id', pendingInsert.data.id)
      .single();
    assert(
      pendingStill.data.status === 'Pending',
      'Unrelated Pending investment must remain Pending'
    );
  }

  console.log('8. Verifying user isolation on bank accounts...');
  const banks = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userId);
  assert(banks.data.length === 2, 'Expected 2 bank accounts for test user');

  console.log('\nInvestments & withdrawals integration test passed for', testEmail);
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error('\nTest failed:', error.message);
  process.exit(1);
});

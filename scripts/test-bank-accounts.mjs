/**
 * Bank account integration tests (no transactions table required).
 * Run: node scripts/test-bank-accounts.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
function validateAddBankAccountForm(values) {
  const errors = {};
  if (!values.accountHolderName.trim()) {
    errors.accountHolderName = 'Account holder name is required';
  }
  if (!values.accountNumber.trim()) {
    errors.accountNumber = 'Account number is required';
  }
  if (!values.confirmAccountNumber.trim()) {
    errors.confirmAccountNumber = 'Please confirm your account number';
  } else if (values.accountNumber !== values.confirmAccountNumber) {
    errors.confirmAccountNumber = 'Account numbers do not match';
  }
  if (!values.ifscCode.trim()) {
    errors.ifscCode = 'IFSC code is required';
  }
  if (!values.authorized) {
    errors.authorized =
      'Please authorize the penny-drop verification to continue';
  }
  return errors;
}

function hasFormErrors(errors) {
  return Object.keys(errors).length > 0;
}

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

if (!url || !key) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(url, key);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log('A. Form validation — authorization required...');
  const authErrors = validateAddBankAccountForm({
    accountHolderName: 'Test User',
    accountNumber: '1234567890',
    confirmAccountNumber: '1234567890',
    ifscCode: 'TEST123',
    accountType: 'Savings',
    authorized: false,
  });
  assert(hasFormErrors(authErrors), 'Should reject when unauthorized');
  assert(Boolean(authErrors.authorized), 'Should include authorization error');

  console.log('B. Form validation — arbitrary IFSC accepted...');
  const ifscErrors = validateAddBankAccountForm({
    accountHolderName: 'Test User',
    accountNumber: '1234567890',
    confirmAccountNumber: '1234567890',
    ifscCode: 'ABC123',
    accountType: 'Current',
    authorized: true,
  });
  assert(!hasFormErrors(ifscErrors), 'Arbitrary IFSC should pass validation');

  const emailA = `banka+${Date.now()}@example.com`;
  const emailB = `bankb+${Date.now()}@example.com`;
  const password = 'TestPass1!';

  console.log('C. Create User A...');
  const signUpA = await supabase.auth.signUp({ email: emailA, password });
  if (signUpA.error) throw new Error(signUpA.error.message);
  const userA = signUpA.data.user?.id;
  if (!userA || !signUpA.data.session) {
    throw new Error('No session for User A — disable email confirmation.');
  }

  console.log('D. Insert User A bank account with IFSC TEST123...');
  const insertA = await supabase
    .from('bank_accounts')
    .insert({
      user_id: userA,
      account_holder_name: 'User A',
      account_number: '1111222233',
      ifsc_code: 'TEST123',
      bank_name: 'TEST Bank',
      account_type: 'Savings',
      is_primary: true,
    })
    .select('id, ifsc_code, user_id')
    .single();
  if (insertA.error) throw new Error(insertA.error.message);
  assert(insertA.data.ifsc_code === 'TEST123', 'IFSC not stored');

  const listA = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userA);
  assert((listA.data ?? []).length === 1, 'User A should have one account');

  await supabase.auth.signOut();

  console.log('E. Create User B...');
  const signUpB = await supabase.auth.signUp({ email: emailB, password });
  if (signUpB.error) throw new Error(signUpB.error.message);
  const userB = signUpB.data.user?.id;
  if (!userB || !signUpB.data.session) {
    throw new Error('No session for User B — disable email confirmation.');
  }

  const insertB = await supabase
    .from('bank_accounts')
    .insert({
      user_id: userB,
      account_holder_name: 'User B',
      account_number: '9999888877',
      ifsc_code: 'XYZ',
      bank_name: 'XYZ Bank',
      account_type: 'Current',
      is_primary: true,
    })
    .select('id')
    .single();
  if (insertB.error) throw new Error(insertB.error.message);

  const listB = await supabase
    .from('bank_accounts')
    .select('id, account_number')
    .eq('user_id', userB);
  assert((listB.data ?? []).length === 1, 'User B should have one account');

  const crossRead = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userA);
  assert((crossRead.data ?? []).length === 0, 'User B must not see User A accounts');

  console.log('\nBank account tests passed.');
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error('\nTest failed:', error.message);
  process.exit(1);
});

/**
 * Integration tests for bank accounts and transactions.
 * Run: node scripts/test-bank-transactions.mjs
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

const testEmail = `banktxn+${Date.now()}@example.com`;
const testPassword = 'TestPass1!';

async function main() {
  console.log('1. Checking transactions table...');
  const tableCheck = await supabase.from('transactions').select('id').limit(1);
  if (tableCheck.error) {
    console.error('transactions table missing:', tableCheck.error.message);
    console.error('Run supabase/migrations/006_transactions.sql first.');
    process.exit(1);
  }

  console.log('2. Creating test user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  if (signUpError) throw new Error(signUpError.message);

  const userId = signUpData.user?.id;
  if (!userId || !signUpData.session) {
    throw new Error('No session — disable email confirmation.');
  }

  await supabase.from('profiles').insert({
    user_id: userId,
    full_name: 'Bank Txn Test User',
    mobile_number: '+91 9555555555',
    email_address: testEmail,
    date_of_birth: '1990-01-01',
    address: 'Test',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin_code: '560001',
    authorized: true,
  });

  console.log('3. Adding bank account with arbitrary IFSC TEST123...');
  const bankInsert = await supabase.from('bank_accounts').insert({
    user_id: userId,
    account_holder_name: 'Bank Txn Test User',
    account_number: '9988776655',
    ifsc_code: 'TEST123',
    bank_name: 'TEST Bank',
    account_type: 'Savings',
    is_primary: true,
  }).select('id, ifsc_code, user_id').single();

  if (bankInsert.error) throw new Error(bankInsert.error.message);
  assert(bankInsert.data.user_id === userId, 'Bank account user_id mismatch');
  assert(bankInsert.data.ifsc_code === 'TEST123', 'IFSC not stored');

  const bankList = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userId);
  assert((bankList.data ?? []).length >= 1, 'Bank account list empty');

  const nominee = await supabase
    .from('nominees')
    .insert({
      user_id: userId,
      nominee_name: 'Nominee',
      relationship: 'Spouse',
      nominee_aadhaar: '555566667777',
      nominee_percentage: '100',
    })
    .select('id')
    .single();
  if (nominee.error) throw new Error(nominee.error.message);

  console.log('4. Pending investment — no transaction yet...');
  const pending = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 250000,
      bank_account_id: bankInsert.data.id,
      nominee_id: nominee.data.id,
      pay_date: '2026-01-01',
      status: 'Pending',
      name: 'Pending Fund',
    })
    .select('id')
    .single();
  if (pending.error) throw new Error(pending.error.message);

  let txnCheck = await supabase
    .from('transactions')
    .select('id')
    .eq('source_type', 'investment')
    .eq('source_id', pending.data.id);
  assert((txnCheck.data ?? []).length === 0, 'Pending investment should have no txn');

  console.log('5. Activate investment — one Instant Credit transaction...');
  const active = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 250000,
      bank_account_id: bankInsert.data.id,
      nominee_id: nominee.data.id,
      pay_date: '2026-01-01',
      status: 'Active',
      name: 'Active Fund',
      invested_date: '2026-01-01',
    })
    .select('id, code')
    .single();
  if (active.error) throw new Error(active.error.message);

  txnCheck = await supabase
    .from('transactions')
    .select('*')
    .eq('source_type', 'investment')
    .eq('source_id', active.data.id)
    .single();
  if (txnCheck.error) throw new Error(txnCheck.error.message);

  assert(txnCheck.data.transaction_type === 'instant_credit', 'Wrong txn type');
  assert(Number(txnCheck.data.amount) === 250000, 'Wrong investment amount');
  assert(txnCheck.data.investment_plan_id === active.data.code, 'Wrong plan id');
  assert(txnCheck.data.reference_id === null, 'Reference should be null');
  assert(txnCheck.data.user_id === userId, 'Txn user_id mismatch');

  await supabase
    .from('investments')
    .update({ status: 'Active' })
    .eq('id', active.data.id);

  const dupCheck = await supabase
    .from('transactions')
    .select('id')
    .eq('source_type', 'investment')
    .eq('source_id', active.data.id);
  assert((dupCheck.data ?? []).length === 1, 'Duplicate investment transaction');

  console.log('6. Withdrawal Processing — no withdrawal transaction...');
  const withdrawal = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      investment_id: active.data.id,
      bank_account_id: bankInsert.data.id,
      withdrawal_amount: 250000,
      net_payout: 100000,
      status: 'Processing',
    })
    .select('id')
    .single();
  if (withdrawal.error) throw new Error(withdrawal.error.message);

  let wTxn = await supabase
    .from('transactions')
    .select('id')
    .eq('source_type', 'withdrawal')
    .eq('source_id', withdrawal.data.id);
  assert((wTxn.data ?? []).length === 0, 'Processing withdrawal should have no txn');

  console.log('7. Approved — investment closed, still no withdrawal txn...');
  await supabase
    .from('withdrawals')
    .update({ status: 'Approved' })
    .eq('id', withdrawal.data.id);

  const invAfterApprove = await supabase
    .from('investments')
    .select('status')
    .eq('id', active.data.id)
    .single();
  assert(invAfterApprove.data.status === 'Closed', 'Investment should be Closed');

  wTxn = await supabase
    .from('transactions')
    .select('id')
    .eq('source_type', 'withdrawal')
    .eq('source_id', withdrawal.data.id);
  assert((wTxn.data ?? []).length === 0, 'Approved withdrawal should have no txn yet');

  console.log('8. Paid — one withdrawal transaction...');
  await supabase
    .from('withdrawals')
    .update({ status: 'Paid' })
    .eq('id', withdrawal.data.id);

  const paidTxn = await supabase
    .from('transactions')
    .select('*')
    .eq('source_type', 'withdrawal')
    .eq('source_id', withdrawal.data.id)
    .single();
  if (paidTxn.error) throw new Error(paidTxn.error.message);

  assert(paidTxn.data.transaction_type === 'withdrawal', 'Wrong withdrawal txn type');
  assert(Number(paidTxn.data.amount) === 100000, 'Should use net_payout');
  assert(paidTxn.data.investment_plan_id === active.data.code, 'Wrong plan on withdrawal');

  await supabase
    .from('withdrawals')
    .update({ status: 'Paid' })
    .eq('id', withdrawal.data.id);

  const dupWithdrawalTxn = await supabase
    .from('transactions')
    .select('id')
    .eq('source_type', 'withdrawal')
    .eq('source_id', withdrawal.data.id);
  assert((dupWithdrawalTxn.data ?? []).length === 1, 'Duplicate withdrawal transaction');

  console.log('9. User transaction list...');
  const userTxns = await supabase
    .from('transactions')
    .select('transaction_code, transaction_type')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false });
  assert((userTxns.data ?? []).length >= 2, 'Expected at least 2 transactions');

  console.log('\nBank accounts + transactions integration tests passed for', testEmail);
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error('\nTest failed:', error.message);
  process.exit(1);
});

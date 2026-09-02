/**
 * Integration test for Home summary Supabase queries.
 * Run: node scripts/test-home-summary-integration.mjs
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

function assertClose(actual, expected, label) {
  if (Math.abs(Number(actual) - expected) > 0.01) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const testEmail = `home+${Date.now()}@example.com`;
const testPassword = 'TestPass1!';

async function main() {
  const tableCheck = await supabase.from('investments').select('id').limit(1);
  if (tableCheck.error) {
    console.error('investments table missing:', tableCheck.error.message);
    process.exit(1);
  }

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
    full_name: 'Home Test User',
    mobile_number: '+91 9444444444',
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
      account_holder_name: 'Home Test User',
      account_number: '7777888899',
      ifsc_code: 'HDFC0001234',
      bank_name: 'HDFC Bank',
      is_primary: true,
    })
    .select('id')
    .single();
  if (bank.error) throw new Error(bank.error.message);

  const nominee = await supabase
    .from('nominees')
    .insert({
      user_id: userId,
      nominee_name: 'Nominee',
      relationship: 'Spouse',
      nominee_aadhaar: '444433332222',
      nominee_percentage: '100',
    })
    .select('id')
    .single();
  if (nominee.error) throw new Error(nominee.error.message);

  const active1 = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 250000,
      total_earnings: 11250,
      bank_account_id: bank.data.id,
      nominee_id: nominee.data.id,
      pay_date: '2026-01-01',
      status: 'Active',
      name: 'Active 1',
      invested_date: '2026-01-01',
    })
    .select('id')
    .single();
  if (active1.error) throw new Error(active1.error.message);

  const active2 = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 300000,
      total_earnings: 22500,
      bank_account_id: bank.data.id,
      nominee_id: nominee.data.id,
      pay_date: '2026-01-01',
      status: 'Active',
      name: 'Active 2',
      invested_date: '2026-01-01',
    })
    .select('id')
    .single();
  if (active2.error) throw new Error(active2.error.message);

  await supabase.from('investments').insert({
    user_id: userId,
    fund_amount: 100000,
    bank_account_id: bank.data.id,
    nominee_id: nominee.data.id,
    pay_date: '2026-01-01',
    status: 'Pending',
    name: 'Pending',
  });

  await supabase.from('investments').insert({
    user_id: userId,
    fund_amount: 200000,
    total_earnings: 30000,
    bank_account_id: bank.data.id,
    nominee_id: nominee.data.id,
    pay_date: '2026-01-01',
    status: 'Closed',
    name: 'Closed',
  });

  const paidWithdrawal = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      investment_id: active1.data.id,
      bank_account_id: bank.data.id,
      withdrawal_amount: 100000,
      net_payout: 100000,
      status: 'Paid',
    })
    .select('id')
    .single();
  if (paidWithdrawal.error) throw new Error(paidWithdrawal.error.message);

  await supabase.from('withdrawals').insert({
    user_id: userId,
    investment_id: active2.data.id,
    bank_account_id: bank.data.id,
    withdrawal_amount: 50000,
    net_payout: 50000,
    status: 'Processing',
  });

  const { data: activeRows } = await supabase
    .from('investments')
    .select('fund_amount, total_earnings')
    .eq('user_id', userId)
    .eq('status', 'Active');

  const { data: paidRows } = await supabase
    .from('withdrawals')
    .select('net_payout, withdrawal_amount')
    .eq('user_id', userId)
    .eq('status', 'Paid');

  const totalInvested = (activeRows ?? []).reduce(
    (sum, row) => sum + Number(row.fund_amount),
    0
  );
  const totalReturns = (activeRows ?? []).reduce(
    (sum, row) => sum + Number(row.total_earnings ?? 0),
    0
  );
  const totalWithdrawals = (paidRows ?? []).reduce(
    (sum, row) => sum + Number(row.net_payout ?? row.withdrawal_amount),
    0
  );

  assertClose(totalInvested, 550000, 'Total Invested');
  assertClose(activeRows.length, 2, 'Active count');
  assertClose(totalReturns, 33750, 'Current Returns');
  assertClose(totalInvested + totalReturns, 583750, 'Maturity Value');
  assertClose(totalWithdrawals, 100000, 'Total Withdrawals');
  assertClose(paidRows.length, 1, 'Paid withdrawal count');

  console.log('Home summary integration test passed for', testEmail);
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error('\nIntegration test failed:', error.message);
  process.exit(1);
});

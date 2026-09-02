/**
 * Integration test for investment interest RPC (requires migrations 003 + 004).
 * Run: node scripts/test-investment-interest-integration.mjs
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
  const a = Number(actual);
  if (Math.abs(a - expected) > 0.01) {
    throw new Error(`${label}: expected ${expected}, got ${a}`);
  }
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const testEmail = `interest+${Date.now()}@example.com`;
const testPassword = 'TestPass1!';

async function main() {
  console.log('Checking RPC function...');
  const rpcCheck = await supabase.rpc('process_user_investment_interest');
  if (
    rpcCheck.error &&
    (rpcCheck.error.message.includes('Could not find the function') ||
      rpcCheck.error.message.includes('Not authenticated'))
  ) {
    if (rpcCheck.error.message.includes('Could not find the function')) {
      console.error(
        'Run supabase/migrations/004_investment_interest.sql in Supabase SQL Editor first.'
      );
      process.exit(1);
    }
  }

  console.log('Creating test user...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  if (signUpError) throw new Error(signUpError.message);

  const userId = signUpData.user?.id;
  if (!userId || !signUpData.session) {
    throw new Error('No session — disable email confirmation in Supabase Auth.');
  }

  await supabase.from('profiles').insert({
    user_id: userId,
    full_name: 'Interest Test User',
    mobile_number: '+91 9333333333',
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
      account_holder_name: 'Interest Test User',
      account_number: '4444555566',
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
      nominee_aadhaar: '111122223333',
      nominee_percentage: '100',
    })
    .select('id')
    .single();
  if (nominee.error) throw new Error(nominee.error.message);

  console.log('Creating Active investment (< 30 days)...');
  const young = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 250000,
      bank_account_id: bank.data.id,
      nominee_id: nominee.data.id,
      pay_date: daysAgo(10),
      status: 'Active',
      name: 'Young Investment',
      invested_date: daysAgo(10),
      interest_rate: 0.05,
      tds_percent: 0.1,
      current_value: 250000,
    })
    .select('id, total_earnings, tds_deducted_amount')
    .single();
  if (young.error) throw new Error(young.error.message);

  await supabase.rpc('process_user_investment_interest');

  const youngAfter = await supabase
    .from('investments')
    .select('total_earnings, tds_deducted_amount, completed_interest_periods')
    .eq('id', young.data.id)
    .single();
  assertClose(youngAfter.data.total_earnings, 0, 'Young total earnings');
  assertClose(youngAfter.data.tds_deducted_amount, 0, 'Young TDS');
  console.log('  TEST 1 PASS — no interest before 30 days');

  console.log('Creating Active investment (30 days)...');
  const oneMonth = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      fund_amount: 250000,
      bank_account_id: bank.data.id,
      nominee_id: nominee.data.id,
      pay_date: daysAgo(30),
      status: 'Active',
      name: 'One Month Investment',
      invested_date: daysAgo(30),
      interest_rate: 0.05,
      tds_percent: 0.1,
      current_value: 250000,
    })
    .select('id')
    .single();
  if (oneMonth.error) throw new Error(oneMonth.error.message);

  await supabase.rpc('process_user_investment_interest');

  const oneMonthAfter = await supabase
    .from('investments')
    .select(
      'total_earnings, tds_deducted_amount, completed_interest_periods, current_value, interest_rate'
    )
    .eq('id', oneMonth.data.id)
    .single();

  assertClose(oneMonthAfter.data.total_earnings, 11250, 'One month earnings');
  assertClose(oneMonthAfter.data.tds_deducted_amount, 1250, 'One month TDS');
  assertClose(oneMonthAfter.data.completed_interest_periods, 1, 'One period');
  assertClose(oneMonthAfter.data.current_value, 261250, 'One month current value');
  assertClose(oneMonthAfter.data.interest_rate, 0.05, 'Interest rate from DB');
  console.log('  TEST 2 PASS — one month accrual');

  await supabase.rpc('process_user_investment_interest');

  const oneMonthAgain = await supabase
    .from('investments')
    .select('total_earnings, tds_deducted_amount')
    .eq('id', oneMonth.data.id)
    .single();
  assertClose(oneMonthAgain.data.total_earnings, 11250, 'No double count earnings');
  assertClose(oneMonthAgain.data.tds_deducted_amount, 1250, 'No double count TDS');
  console.log('  TEST 3 PASS — repeated RPC does not double-count');

  console.log('\nInvestment interest integration tests passed for', testEmail);
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error('\nIntegration test failed:', error.message);
  process.exit(1);
});

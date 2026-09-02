/**
 * Integration tests for My Profile data retrieval.
 * Run: node scripts/test-profile.mjs
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

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatDob(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = date.getDate().toString().padStart(2, '0');
  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

async function createRegisteredUser(prefix, fullName, email) {
  const password = 'TestPass1!';
  const signUp = await supabase.auth.signUp({ email, password });
  if (signUp.error) throw new Error(signUp.error.message);

  const userId = signUp.data.user?.id;
  if (!userId || !signUp.data.session) {
    throw new Error('No session — disable email confirmation.');
  }

  await supabase.from('profiles').insert({
    user_id: userId,
    full_name: fullName,
    mobile_number: '+91 90000 11111',
    email_address: email,
    date_of_birth: '1990-05-15',
    address: '123 Test Street',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin_code: '560001',
    authorized: true,
  });

  await supabase.from('kyc_documents').insert({
    user_id: userId,
    aadhaar_number: '123456789012',
    pan_number: `${prefix}PAN1234F`,
    aadhaar_front_path: `${userId}/aadhaar_front.jpg`,
    aadhaar_back_path: `${userId}/aadhaar_back.jpg`,
    pan_card_path: `${userId}/pan_card.jpg`,
  });

  return { userId, email, password, fullName, panNumber: `${prefix}PAN1234F` };
}

async function main() {
  console.log('1. Create User A with profile + KYC...');
  const emailA = `profilea+${Date.now()}@example.com`;
  const userA = await createRegisteredUser('A', 'Alice Anderson', emailA);

  const profileA = await supabase
    .from('profiles')
    .select('full_name, mobile_number, email_address, date_of_birth')
    .eq('user_id', userA.userId)
    .single();
  if (profileA.error) throw new Error(profileA.error.message);

  const kycA = await supabase
    .from('kyc_documents')
    .select('pan_number')
    .eq('user_id', userA.userId)
    .single();
  if (kycA.error) throw new Error(kycA.error.message);

  assert(profileA.data.full_name === 'Alice Anderson', 'User A full name mismatch');
  assert(kycA.data.pan_number === userA.panNumber, 'User A PAN mismatch');
  assert(
    formatDob(profileA.data.date_of_birth) === '15 May 1990',
    'User A DOB format mismatch'
  );

  await supabase.auth.signOut();

  console.log('2. Create User B with profile + KYC...');
  const emailB = `profileb+${Date.now()}@example.com`;
  const userB = await createRegisteredUser('B', 'Bob Baker', emailB);

  const signInB = await supabase.auth.signInWithPassword({
    email: emailB,
    password: 'TestPass1!',
  });
  if (signInB.error) throw new Error(signInB.error.message);

  const profileB = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', userB.userId)
    .single();
  if (profileB.error) throw new Error(profileB.error.message);

  const crossRead = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', userA.userId);
  assert((crossRead.data ?? []).length === 0, 'User B must not read User A profile');

  assert(profileB.data.full_name === 'Bob Baker', 'User B full name mismatch');

  console.log('3. Update User B profile in database...');
  await supabase.auth.signOut();
  const signInA = await supabase.auth.signInWithPassword({
    email: emailA,
    password: 'TestPass1!',
  });
  if (signInA.error) throw new Error(signInA.error.message);

  const updatedName = 'Alice Anderson Updated';
  const updateResult = await supabase
    .from('profiles')
    .update({ full_name: updatedName })
    .eq('user_id', userA.userId)
    .select('full_name')
    .single();
  if (updateResult.error) throw new Error(updateResult.error.message);
  assert(updateResult.data.full_name === updatedName, 'Profile update failed');

  const refreshed = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', userA.userId)
    .single();
  assert(refreshed.data.full_name === updatedName, 'Updated name not returned');

  console.log('4. User without profile returns empty...');
  await supabase.auth.signOut();
  const orphanEmail = `orphan+${Date.now()}@example.com`;
  const orphanSignUp = await supabase.auth.signUp({
    email: orphanEmail,
    password: 'TestPass1!',
  });
  if (orphanSignUp.error) throw new Error(orphanSignUp.error.message);
  const orphanId = orphanSignUp.data.user?.id;
  if (!orphanId || !orphanSignUp.data.session) {
    throw new Error('No orphan session');
  }

  const orphanProfile = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', orphanId)
    .maybeSingle();
  assert(orphanProfile.data === null, 'Orphan user should have no profile row');

  console.log('\nMy Profile integration tests passed.');
  await supabase.auth.signOut();
}

main().catch((error) => {
  console.error('\nTest failed:', error.message);
  process.exit(1);
});

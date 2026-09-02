/**
 * Deploy the OTP Supabase Edge Function.
 *
 * Prerequisites:
 * - Supabase CLI installed or available via npx
 * - Logged in: npx supabase login
 * - Edge Function secrets set in Supabase Dashboard:
 *   OTP_APP_ID, OTP_API_KEY, OTP_BRAND_ID
 *
 * Run: node scripts/deploy-otp-function.mjs
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';

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

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.EXPO_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0];

if (!projectRef) {
  console.error(
    'Could not determine Supabase project ref. Set SUPABASE_PROJECT_REF in .env'
  );
  process.exit(1);
}

console.log(`Deploying otp edge function to project ${projectRef}...`);

const result = spawnSync(
  'npx',
  ['supabase', 'functions', 'deploy', 'otp', '--project-ref', projectRef],
  {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  }
);

if (result.status !== 0) {
  console.error('\nDeploy failed.');
  console.error('Manual steps:');
  console.error('1. npx supabase login');
  console.error('2. Set Edge Function secrets: OTP_APP_ID, OTP_API_KEY, OTP_BRAND_ID');
  console.error(`3. npx supabase functions deploy otp --project-ref ${projectRef}`);
  process.exit(result.status ?? 1);
}

console.log('\nOTP edge function deployed successfully.');

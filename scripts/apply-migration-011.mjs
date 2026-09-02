/**
 * Applies supabase/migrations/011_referral_stats_distinct_users.sql
 * Requires SUPABASE_DB_URL in .env
 *
 * Run: node scripts/apply-migration-011.mjs
 */
import pg from 'pg';
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

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    'Missing SUPABASE_DB_URL in .env. Run 011_referral_stats_distinct_users.sql in the Supabase SQL Editor instead.'
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/011_referral_stats_distinct_users.sql'
  ),
  'utf8'
);

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log('Migration 011 applied successfully.');
} finally {
  await client.end();
}

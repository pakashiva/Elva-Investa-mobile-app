/**
 * Applies 017_investor_notifications_and_refinements.sql
 * Run: node scripts/apply-migration-017.mjs
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
    'Missing SUPABASE_DB_URL. Run 017_investor_notifications_and_refinements.sql in Supabase SQL Editor.'
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/017_investor_notifications_and_refinements.sql'
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
  console.log('Migration 017 applied successfully.');
} finally {
  await client.end();
}

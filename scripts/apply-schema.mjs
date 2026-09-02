/**
 * Applies supabase/migrations/001_registration_schema.sql
 * Requires SUPABASE_DB_URL in .env (Supabase → Project Settings → Database → Connection string)
 *
 * Run: node scripts/apply-schema.mjs
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
    'Missing SUPABASE_DB_URL in .env. Add your Supabase Postgres connection string to apply migrations.'
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/001_registration_schema.sql'),
  'utf8'
);

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log('Schema applied successfully.');
} finally {
  await client.end();
}

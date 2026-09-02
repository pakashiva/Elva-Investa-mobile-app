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

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'xbdejidqlldwzoxgqpii';

if (!token) {
  console.log('No SUPABASE_ACCESS_TOKEN set');
  process.exit(0);
}

const sql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/001_registration_schema.sql'),
  'utf8'
);

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  }
);

const body = await response.text();
console.log(response.status, body);

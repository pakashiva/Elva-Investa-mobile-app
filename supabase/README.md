# Supabase backend setup

## 1. Environment variables

Copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Optional (schema apply script only — never commit):

```env
SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_ACCESS_TOKEN=your_personal_access_token
```

## 2. Apply database schema

Run the SQL in `supabase/migrations/001_registration_schema.sql` using one of:

- **Supabase Dashboard → SQL Editor** (recommended)
- `node scripts/apply-schema.mjs` (requires `SUPABASE_DB_URL`)
- `node scripts/apply-schema-api.mjs` (requires `SUPABASE_ACCESS_TOKEN`)

This creates tables **and** the `kyc-documents` storage bucket.

If you already created tables but registration fails with **"Bucket not found"**, run:

`supabase/migrations/002_kyc_storage_bucket.sql`

For fund requests, investments, and withdrawals, also run:

`supabase/migrations/003_investments_withdrawals.sql`

For monthly interest accrual (5% p.m., 30-day periods), also run:

`supabase/migrations/004_investment_interest.sql`

For bank account type (Savings / Current), also run:

`supabase/migrations/005_bank_account_type.sql`

For the transactions ledger, also run:

`supabase/migrations/006_transactions.sql`

Or: `node scripts/apply-migration-006.mjs` (requires `SUPABASE_DB_URL`)

For mobile OTP verification, also run:

`supabase/migrations/007_mobile_verified.sql`

Or: `node scripts/apply-migration-007.mjs` (requires `SUPABASE_DB_URL`)

Then deploy the OTP edge function (see below).

**Or create the bucket manually:**

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `kyc-documents`
3. **Public bucket: OFF** (private)
4. Then run `002_kyc_storage_bucket.sql` for the storage policies

## 3. Auth settings

In **Supabase Dashboard → Authentication → Providers → Email**:

- Enable Email provider
- **Disable “Confirm email”** for mobile registration (avoids confirmation emails and returns a session immediately)

## 4. Rate limits (if you see "email rate limit exceeded")

During development, repeated sign-ups can hit Supabase Auth email rate limits.

**Quick fixes:**
1. Wait 15–60 minutes before trying again
2. Use a **different email address** for the next test
3. In **Supabase Dashboard → Authentication → Rate Limits**, increase the email-sending limit
4. Keep **Confirm email** disabled so sign-up does not send a confirmation email each time

## 5. Verify

```bash
node scripts/test-supabase.mjs
node scripts/test-bank-accounts.mjs
node scripts/test-bank-transactions.mjs   # requires migration 006
node scripts/test-otp-flow.mjs            # requires migration 007
```

## 6. OTP service (Elvatech — not Supabase Auth OTP)

The app calls your Elvatech OTP API directly:

- `POST https://api.notify.elvatech.in/otp/send`
- `POST https://api.notify.elvatech.in/otp/resend`
- `POST https://api.notify.elvatech.in/otp/verify`

Add to `.env`:

```env
EXPO_PUBLIC_OTP_API_BASE_URL=https://api.notify.elvatech.in
EXPO_PUBLIC_OTP_APP_ID=eNandi
EXPO_PUBLIC_OTP_API_KEY=your_key
EXPO_PUBLIC_OTP_BRAND_ID=elva-sales
```

Restart Expo after changing `.env` (`npx expo start -c`).

Also apply:

- `supabase/migrations/007_mobile_verified.sql`
- `supabase/migrations/008_otp_recovery.sql`

The optional `supabase/functions/otp` edge function is no longer required for the mobile app.

## RLS

See `supabase/RLS.md` for policy documentation.

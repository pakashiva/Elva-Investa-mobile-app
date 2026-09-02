# Supabase Row Level Security Policies

This document describes the RLS policies created by `migrations/001_registration_schema.sql`.

## Application tables

All policies use `auth.uid() = user_id` so authenticated users can only access their own records.

### `profiles`
- `profiles_select_own` — SELECT own profile
- `profiles_insert_own` — INSERT own profile on registration
- `profiles_update_own` — UPDATE own profile
- `mobile_verified` — set to `true` only by the OTP edge function (service role). Trigger `trg_protect_mobile_verified` blocks authenticated clients from setting it directly.

## Mobile OTP verification (`007_mobile_verified.sql`)

- Adds `profiles.mobile_verified BOOLEAN NOT NULL DEFAULT FALSE`
- Existing profiles at migration time are backfilled to verified
- OTP edge function `otp` verifies with provider, then updates `mobile_verified` using service role

## Investments & withdrawals (`003_investments_withdrawals.sql`)

### `kyc_documents`
- `kyc_select_own` — SELECT own KYC metadata
- `kyc_insert_own` — INSERT own KYC metadata
- `kyc_update_own` — UPDATE own KYC metadata

### `bank_accounts`
- `bank_accounts_select_own` — SELECT own bank accounts
- `bank_accounts_insert_own` — INSERT own bank accounts
- `bank_accounts_update_own` — UPDATE own bank accounts

### `nominees`
- `nominees_select_own` — SELECT own nominee records
- `nominees_insert_own` — INSERT own nominee records
- `nominees_update_own` — UPDATE own nominee records

## Investments & withdrawals (`003_investments_withdrawals.sql`)

### `investments`
- `investments_select_own` — SELECT own investments / fund requests
- `investments_insert_own` — INSERT own fund requests (status defaults to `Pending`)
- `investments_update_own` — UPDATE own investments (mobile app does not change status; admin portal may use service role)

### `withdrawals`
- `withdrawals_select_own` — SELECT own withdrawal requests
- `withdrawals_insert_own` — INSERT own withdrawal requests (status defaults to `Processing`)

Withdrawal status changes (`Processing` → `Approved`) are intended for the admin portal (service role). When a withdrawal becomes `Approved`, the database trigger `trg_withdrawal_approved_close_investment` sets the linked **Active** investment to `Closed`.

## Interest accrual (`004_investment_interest.sql`)

### New investment columns
- `invested_date` — date interest accrual begins (Active investments)
- `interest_rate` — monthly rate as decimal (`0.05` = 5% per month)
- `tds_percent` — TDS rate as decimal (`0.10` = 10%)
- `completed_interest_periods` — 30-day periods already credited
- `total_earnings` — cumulative net earnings after TDS
- `tds_deducted_amount` — cumulative TDS deducted

### RPC function
- `process_user_investment_interest()` — `SECURITY DEFINER`, callable by `authenticated` users
- Uses `auth.uid()` — only processes the caller's **Active** investments
- Row-level `FOR UPDATE` locks prevent duplicate period crediting
- Only **Active** investments with a non-null `invested_date` accrue interest

## Transactions (`006_transactions.sql`)

### `transactions` table
- `transaction_code` — display ID (e.g. `TXN-894721`)
- `transaction_type` — `instant_credit` or `withdrawal`
- `source_type` + `source_id` — unique pair prevents duplicate ledger entries
- `reference_id` — nullable (NULL displayed as `—` in app)

### RLS
- `transactions_select_own` — users can read only their own transactions
- No INSERT/UPDATE/DELETE for authenticated users (triggers create records)

### Triggers
- `trg_investment_active_transaction` — investment → **Active** creates one **Instant Credit** transaction
- `trg_withdrawal_paid_transaction` — withdrawal → **Paid** creates one **Withdrawal** transaction
- Existing `trg_withdrawal_approved_close_investment` unchanged (Approved → investment Closed)

## Storage (`kyc-documents` bucket)

Documents are stored at `{user_id}/{document_type}.{ext}`.

- `kyc_storage_insert_own` — upload only into own folder
- `kyc_storage_select_own` — read only own documents
- `kyc_storage_update_own` — replace only own documents
- `kyc_storage_delete_own` — delete only own documents

The bucket is **private** (`public = false`). No public read access.

## Notes

- No service-role key is used in the mobile app.
- `confirmAccountNumber` is not stored; it is validated client-side only.
- Passwords are handled exclusively by Supabase Auth (`auth.users`).

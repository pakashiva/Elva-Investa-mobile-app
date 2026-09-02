-- Add account type to bank accounts (Savings / Current)

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'Savings'
    CHECK (account_type IN ('Savings', 'Current'));

COMMENT ON COLUMN public.bank_accounts.account_type IS 'Bank account type: Savings or Current';

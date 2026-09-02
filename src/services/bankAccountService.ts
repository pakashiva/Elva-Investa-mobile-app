import { supabase } from '../lib/supabase';
import { BankAccount, BankAccountType } from '../types/bankAccount';
import { BankAccount as DropdownBankAccount } from '../types/fundRequest';
import { detectBankNameFromIfsc } from '../utils/bankName';
import { isMissingTableError } from '../utils/supabaseErrors';

type BankAccountRow = {
  id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: string;
  is_primary: boolean;
};

function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '****';
  return `**** ${last4}`;
}

function resolveBankName(ifscCode: string): string {
  const detected = detectBankNameFromIfsc(ifscCode);
  if (detected) {
    return detected;
  }
  const prefix = ifscCode.trim().toUpperCase().slice(0, 4);
  return prefix ? `${prefix} Bank` : 'Bank Account';
}

export function formatBankAccountLabel(
  bankName: string,
  accountNumber: string
): string {
  return `${bankName} ${maskAccountNumber(accountNumber)}`;
}

function mapBankAccountRow(row: BankAccountRow): BankAccount {
  const bankName = row.bank_name.trim();
  const accountType = (row.account_type === 'Current' ? 'Current' : 'Savings') as BankAccountType;

  return {
    id: row.id,
    bankName,
    initial: (bankName.charAt(0) || 'B').toUpperCase(),
    maskedNumber: maskAccountNumber(row.account_number),
    ifsc: row.ifsc_code,
    accountType,
    badge: row.is_primary ? 'Primary' : 'Verified',
    isPrimary: row.is_primary,
  };
}

export async function getUserBankAccountsList(userId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id, bank_name, account_number, ifsc_code, account_type, is_primary')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapBankAccountRow(row as BankAccountRow));
}

/** Minimal shape for fund request / withdrawal dropdowns */
export async function getUserBankAccounts(userId: string): Promise<DropdownBankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id, bank_name, account_number')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    label: formatBankAccountLabel(row.bank_name, row.account_number),
  }));
}

export type CreateBankAccountInput = {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: BankAccountType;
};

export async function createBankAccount(
  userId: string,
  input: CreateBankAccountInput
): Promise<void> {
  const { count, error: countError } = await supabase
    .from('bank_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(countError.message);
  }

  const ifscCode = input.ifscCode.trim().toUpperCase();
  const { error } = await supabase.from('bank_accounts').insert({
    user_id: userId,
    account_holder_name: input.accountHolderName.trim(),
    account_number: input.accountNumber.trim(),
    ifsc_code: ifscCode,
    bank_name: resolveBankName(ifscCode),
    account_type: input.accountType,
    is_primary: (count ?? 0) === 0,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyBankAccountOwnership(
  userId: string,
  bankAccountId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userId)
    .eq('id', bankAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

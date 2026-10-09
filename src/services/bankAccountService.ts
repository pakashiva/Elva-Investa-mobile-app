import { BankAccount, BankAccountType } from '../types/bankAccount';
import { BankAccount as DropdownBankAccount } from '../types/fundRequest';
import { detectBankNameFromIfsc } from '../utils/bankName';
import { apiRequest } from '../lib/api';

type BankApiRow = {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  isPrimary: boolean;
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

function mapBank(row: BankApiRow): BankAccount {
  const bankName = row.bankName.trim();
  const accountType = (
    row.accountType === 'Current' ? 'Current' : 'Savings'
  ) as BankAccountType;

  return {
    id: row.id,
    bankName,
    initial: (bankName.charAt(0) || 'B').toUpperCase(),
    maskedNumber: maskAccountNumber(row.accountNumber),
    ifsc: row.ifscCode,
    accountType,
    badge: row.isPrimary ? 'Primary' : 'Verified',
    isPrimary: row.isPrimary,
  };
}

async function fetchBanks(): Promise<BankApiRow[]> {
  const data = await apiRequest<{ banks: BankApiRow[] }>('/api/mobile/banks');
  return data.banks ?? [];
}

export async function getUserBankAccountsList(
  _userId?: string
): Promise<BankAccount[]> {
  const banks = await fetchBanks();
  return banks.map(mapBank);
}

export async function getUserBankAccounts(
  _userId?: string
): Promise<DropdownBankAccount[]> {
  const banks = await fetchBanks();
  return banks.map((row) => ({
    id: row.id,
    label: formatBankAccountLabel(row.bankName, row.accountNumber),
  }));
}

export type CreateBankAccountInput = {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: BankAccountType;
};

export async function createBankAccount(
  _userId: string,
  input: CreateBankAccountInput
): Promise<void> {
  const ifscCode = input.ifscCode.trim().toUpperCase();
  await apiRequest('/api/mobile/banks', {
    method: 'POST',
    body: JSON.stringify({
      accountHolderName: input.accountHolderName.trim(),
      accountNumber: input.accountNumber.trim(),
      ifscCode,
      accountType: input.accountType,
      bankName: resolveBankName(ifscCode),
    }),
  });
}

export async function verifyBankAccountOwnership(
  userId: string,
  bankAccountId: string
): Promise<boolean> {
  const banks = await getUserBankAccounts(userId);
  return banks.some((bank) => bank.id === bankAccountId);
}

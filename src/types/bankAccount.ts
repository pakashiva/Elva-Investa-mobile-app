export type BankAccountBadge = 'Primary' | 'Verified';

export type BankAccountType = 'Savings' | 'Current';

export interface BankAccount {
  id: string;
  bankName: string;
  initial: string;
  maskedNumber: string;
  ifsc: string;
  accountType: BankAccountType;
  badge: BankAccountBadge;
  isPrimary: boolean;
}

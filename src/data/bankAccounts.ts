import { BankAccount } from '../types/bankAccount';

/** Temporary dummy bank accounts — matches reference; replaced by backend later */
export const DUMMY_BANK_ACCOUNTS_LIST: BankAccount[] = [
  {
    id: 'bank1',
    bankName: 'HDFC Bank Ltd',
    initial: 'H',
    maskedNumber: '**** 4523',
    ifsc: 'HDFC0000124',
    accountType: 'Savings',
    badge: 'Primary',
    isPrimary: true,
  },
  {
    id: 'bank2',
    bankName: 'State Bank of India',
    initial: 'S',
    maskedNumber: '**** 9162',
    ifsc: 'SBIN0000841',
    accountType: 'Savings',
    badge: 'Verified',
    isPrimary: false,
  },
  {
    id: 'bank3',
    bankName: 'ICICI Bank Ltd',
    initial: 'I',
    maskedNumber: '**** 8812',
    ifsc: 'ICIC0000311',
    accountType: 'Current',
    badge: 'Verified',
    isPrimary: false,
  },
];

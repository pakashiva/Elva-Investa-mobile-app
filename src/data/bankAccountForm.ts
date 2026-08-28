import { AddBankAccountFormValues } from '../types/bankAccountForm';

/** Initial dummy values shown in the reference design */
export const ADD_BANK_ACCOUNT_DEFAULTS: AddBankAccountFormValues = {
  accountHolderName: 'Rajesh Kumar',
  accountNumber: '5010024984523',
  confirmAccountNumber: '',
  ifscCode: 'HDFC0000124',
  accountType: 'Savings',
  authorized: true,
};

/** Basic IFSC format check for local UI validation only */
export function isValidIfscFormat(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim());
}

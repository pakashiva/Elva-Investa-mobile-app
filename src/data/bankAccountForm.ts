// More -> Bank details -> Add bank account

import { AddBankAccountFormValues } from '../types/bankAccountForm';

/** Initial dummy values shown in the reference design */
export const ADD_BANK_ACCOUNT_DEFAULTS: AddBankAccountFormValues = {
  accountHolderName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscCode: '',
  accountType: 'Savings',
  authorized: true,
};

/** Basic IFSC format check for local UI validation only */
export function isValidIfscFormat(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim());
}

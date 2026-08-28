import { BankAccountType } from './bankAccount';

export type AddBankAccountFormValues = {
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountType: BankAccountType;
  authorized: boolean;
};

export type AddBankAccountFormErrors = Partial<
  Record<
    | 'accountHolderName'
    | 'accountNumber'
    | 'confirmAccountNumber'
    | 'ifscCode'
    | 'authorized',
    string
  >
>;

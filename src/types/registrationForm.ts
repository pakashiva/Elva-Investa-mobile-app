import { BankAccountType } from './bankAccount';

export type DocumentUploadValue = {
  uri: string | null;
  fileName: string;
  isUserSelected: boolean;
};

export type RegistrationFormValues = {
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  aadhaarNumber: string;
  panNumber: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: BankAccountType;
  nomineeName: string;
  relationship: string;
  nomineeAadhaar: string;
  nomineePercentage: string;
  password: string;
  confirmPassword: string;
  authorized: boolean;
};

export type RegistrationFormErrors = Partial<
  Record<keyof RegistrationFormValues, string>
>;

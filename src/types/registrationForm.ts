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
  aadhaarFront: DocumentUploadValue;
  aadhaarBack: DocumentUploadValue;
  panNumber: string;
  panCard: DocumentUploadValue;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  bankName: string;
  nomineeName: string;
  relationship: string;
  nomineeAadhaar: string;
  nomineePercentage: string;
  authorized: boolean;
};

export type RegistrationFormErrors = Partial<
  Record<keyof RegistrationFormValues, string>
>;

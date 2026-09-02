import { RegistrationFormValues } from '../types/registrationForm';

export const RELATIONSHIP_OPTIONS = [
  { id: 'spouse', label: 'Spouse' },
  { id: 'father', label: 'Father' },
  { id: 'mother', label: 'Mother' },
  { id: 'son', label: 'Son' },
  { id: 'daughter', label: 'Daughter' },
  { id: 'brother', label: 'Brother' },
  { id: 'sister', label: 'Sister' },
  { id: 'other', label: 'Other' },
];

/** Dummy values shown in the reference design */
export const REGISTRATION_FORM_DEFAULTS: RegistrationFormValues = {
  fullName: '',
  mobileNumber: '',
  emailAddress: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  aadhaarNumber: '',
  aadhaarFront: {
    uri: null,
    fileName: '',
    isUserSelected: false,
  },
  aadhaarBack: {
    uri: null,
    fileName: '',
    isUserSelected: false,
  },
  panNumber: '',
  panCard: {
    uri: null,
    fileName: '',
    isUserSelected: false,
  },
  accountHolderName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscCode: '',
  bankName: '',
  accountType: 'Savings',
  nomineeName: '',
  relationship: '',
  nomineeAadhaar: '',
  nomineePercentage: '',
  password: '',
  confirmPassword: '',
  authorized: false,
};

export const REGISTRATION_PASSWORD_HINT =
  'Must be at least 8 characters with 1 uppercase, 1 number & 1 special character';

export const REGISTRATION_AUTHORIZATION_TEXT =
  'I agree to the Terms & Conditions and authorize Roxru Financial to conduct secure digital KYC verification of my submitted identity documents.';

export const REGISTRATION_SECURITY_TEXT =
  'SEBI & RBI compliant bank-grade encryption protocols protect your private data.';

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
  panNumber: '',
  accountHolderName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscCode: '',
  bankName: '',
  accountType: 'Savings',
  nomineeName: '',
  relationship: '',
  nomineeAadhaar: '',
  password: '',
  confirmPassword: '',
  authorized: false,
};

export const REGISTRATION_PASSWORD_HINT =
  'Must be at least 8 characters with 1 uppercase, 1 number & 1 special character';

export const REGISTRATION_AUTHORIZATION_TEXT =
  'I agree to the Terms & Conditions and authorize Roxru Financial to conduct secure digital KYC verification using my Aadhaar and PAN details.';

export const REGISTRATION_SECURITY_TEXT =
  'SEBI & RBI compliant bank-grade encryption protocols protect your private data.';

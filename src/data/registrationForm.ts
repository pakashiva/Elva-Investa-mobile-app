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
  fullName: 'Rajesh Kumar',
  mobileNumber: '+91 9876543210',
  emailAddress: 'rajesh.kumar@gmail.com',
  dateOfBirth: '15/08/1992',
  address: 'Flat 402, Lotus Residency, MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pinCode: '560001',
  aadhaarNumber: '4829 1048 2938',
  aadhaarFront: {
    uri: null,
    fileName: 'aadhaar_front.jpg',
    isUserSelected: false,
  },
  aadhaarBack: {
    uri: null,
    fileName: 'aadhaar_back.jpg',
    isUserSelected: false,
  },
  panNumber: 'AKLPK2019H',
  panCard: {
    uri: null,
    fileName: 'pancard_scan.jpg',
    isUserSelected: false,
  },
  accountHolderName: 'Rajesh Kumar',
  accountNumber: '5010024984523',
  confirmAccountNumber: '5010024984523',
  ifscCode: 'HDFC0000124',
  bankName: 'HDFC Bank Limited (Auto Detected)',
  nomineeName: 'Sunita Kumar',
  relationship: 'spouse',
  nomineeAadhaar: '2938 1048 4829',
  nomineePercentage: '100%',
  authorized: true,
};

export const REGISTRATION_AUTHORIZATION_TEXT =
  'I agree to the Terms & Conditions and authorize Roxru Financial to conduct secure digital KYC verification of my submitted identity documents.';

export const REGISTRATION_SECURITY_TEXT =
  'SEBI & RBI compliant bank-grade encryption protocols protect your private data.';

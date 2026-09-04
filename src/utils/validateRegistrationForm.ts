import {
  RegistrationFormErrors,
  RegistrationFormValues,
} from '../types/registrationForm';

function isEmpty(value: string): boolean {
  return !value.trim();
}

export function validateRegistrationForm(
  values: RegistrationFormValues
): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {};

  if (isEmpty(values.fullName)) errors.fullName = 'Full name is required';
  if (isEmpty(values.mobileNumber)) errors.mobileNumber = 'Mobile number is required';
  if (isEmpty(values.emailAddress)) errors.emailAddress = 'Email address is required';
  if (isEmpty(values.dateOfBirth)) errors.dateOfBirth = 'Date of birth is required';
  if (isEmpty(values.address)) errors.address = 'Address is required';
  if (isEmpty(values.city)) errors.city = 'City is required';
  if (isEmpty(values.state)) errors.state = 'State is required';
  if (isEmpty(values.pinCode)) errors.pinCode = 'PIN code is required';

  if (isEmpty(values.aadhaarNumber)) {
    errors.aadhaarNumber = 'Aadhaar card number is required';
  }
  if (isEmpty(values.panNumber)) errors.panNumber = 'PAN card number is required';

  if (isEmpty(values.accountHolderName)) {
    errors.accountHolderName = 'Account holder name is required';
  }
  if (isEmpty(values.accountNumber)) errors.accountNumber = 'Account number is required';
  if (isEmpty(values.confirmAccountNumber)) {
    errors.confirmAccountNumber = 'Please confirm your account number';
  } else if (values.accountNumber !== values.confirmAccountNumber) {
    errors.confirmAccountNumber = 'Account numbers do not match';
  }
  if (isEmpty(values.ifscCode)) errors.ifscCode = 'IFSC code is required';
  if (isEmpty(values.bankName)) errors.bankName = 'Bank name is required';

  if (isEmpty(values.nomineeName)) errors.nomineeName = 'Nominee name is required';
  if (isEmpty(values.relationship)) errors.relationship = 'Relationship is required';
  if (isEmpty(values.nomineeAadhaar)) {
    errors.nomineeAadhaar = 'Nominee Aadhaar number is required';
  }
  if (isEmpty(values.nomineePercentage)) {
    errors.nomineePercentage = 'Nominee percentage is required';
  }

  if (isEmpty(values.password)) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (isEmpty(values.confirmPassword)) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!values.authorized) {
    errors.authorized = 'Please accept the terms to continue';
  }

  return errors;
}

export function hasFormErrors(errors: RegistrationFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

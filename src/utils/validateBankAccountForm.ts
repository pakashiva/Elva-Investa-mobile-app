import {
  AddBankAccountFormErrors,
  AddBankAccountFormValues,
} from '../types/bankAccountForm';

export function validateAddBankAccountForm(
  values: AddBankAccountFormValues
): AddBankAccountFormErrors {
  const errors: AddBankAccountFormErrors = {};

  if (!values.accountHolderName.trim()) {
    errors.accountHolderName = 'Account holder name is required';
  }

  if (!values.accountNumber.trim()) {
    errors.accountNumber = 'Account number is required';
  }

  if (!values.confirmAccountNumber.trim()) {
    errors.confirmAccountNumber = 'Please confirm your account number';
  } else if (values.accountNumber !== values.confirmAccountNumber) {
    errors.confirmAccountNumber = 'Account numbers do not match';
  }

  if (!values.ifscCode.trim()) {
    errors.ifscCode = 'IFSC code is required';
  }

  if (!values.authorized) {
    errors.authorized =
      'Please authorize the penny-drop verification to continue';
  }

  return errors;
}

export function hasFormErrors(errors: AddBankAccountFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

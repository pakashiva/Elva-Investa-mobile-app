import {
  AddNomineeFormErrors,
  AddNomineeFormValues,
} from '../types/nominee';
import { validateAadhaarNumber } from './indianValidators';

function isEmpty(value: string): boolean {
  return !value.trim();
}

export function validateAddNomineeForm(
  values: AddNomineeFormValues
): AddNomineeFormErrors {
  const errors: AddNomineeFormErrors = {};

  if (isEmpty(values.nomineeName)) {
    errors.nomineeName = 'Nominee name is required';
  }

  if (isEmpty(values.relationship)) {
    errors.relationship = 'Relationship is required';
  }

  if (isEmpty(values.nomineeAadhaar)) {
    errors.nomineeAadhaar = 'Nominee Aadhaar number is required';
  } else {
    const aadhaarError = validateAadhaarNumber(values.nomineeAadhaar);
    if (aadhaarError) {
      errors.nomineeAadhaar = aadhaarError;
    }
  }

  return errors;
}

export function hasNomineeFormErrors(errors: AddNomineeFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

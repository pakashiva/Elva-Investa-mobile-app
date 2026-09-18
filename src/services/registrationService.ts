import { parseDateOfBirth } from '../utils/formatDate';
import { RegistrationFormValues } from '../types/registrationForm';
import { normalizeMobileDigits } from '../utils/indianValidators';
import { signUpWithEmail, signOut } from './authService';
import { supabase } from '../lib/supabase';
import {
  clearPendingRegistration,
  loadPendingRegistration,
  savePendingRegistration,
} from './registrationPendingStore';

export type RegistrationResult = {
  userId: string;
  mobileNumber: string;
};

function toIsoDate(dateOfBirth: string): string {
  const date = parseDateOfBirth(dateOfBirth);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDuplicateError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('duplicate') ||
    lower.includes('unique') ||
    lower.includes('already exists')
  );
}

async function assertEmailMobileComboAvailable(
  email: string,
  mobile: string
): Promise<void> {
  const { data, error } = await supabase.rpc('is_email_mobile_combo_available', {
    p_email: email,
    p_mobile: mobile,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data === false) {
    throw new Error(
      'An account with this email and mobile number combination already exists. Try signing in, or use a different email/mobile pair.'
    );
  }
}

/**
 * Creates Auth session only. Profile / customer / KYC rows are written after OTP
 * so the admin portal does not see the customer beforehand.
 */
export async function beginRegistration(
  form: RegistrationFormValues
): Promise<RegistrationResult> {
  const mobileNumber = normalizeMobileDigits(form.mobileNumber);
  const emailAddress = form.emailAddress.trim().toLowerCase();

  await assertEmailMobileComboAvailable(emailAddress, mobileNumber);

  const { session } = await signUpWithEmail(
    emailAddress,
    form.password,
    form.fullName
  );

  if (!session?.user?.id) {
    throw new Error(
      'Account was created but no active session is available. Disable email confirmation in Supabase Auth settings for mobile registration, or confirm your email before signing in.'
    );
  }

  const userId = session.user.id;

  try {
    await savePendingRegistration(userId, {
      ...form,
      mobileNumber,
      emailAddress,
    });
  } catch (error) {
    await signOut();
    throw error instanceof Error
      ? error
      : new Error('Unable to save registration details.');
  }

  return { userId, mobileNumber };
}

/** @deprecated Use beginRegistration + completeRegistrationAfterOtp */
export async function registerUser(
  form: RegistrationFormValues
): Promise<RegistrationResult> {
  return beginRegistration(form);
}

/**
 * Persists profile (triggers customer + referral), KYC, bank, nominee, MPIN hash.
 * Call only after OTP verification succeeds.
 * Safe to retry if a previous attempt partially succeeded.
 */
export async function completeRegistrationAfterOtp(
  userId: string
): Promise<void> {
  const form = await loadPendingRegistration(userId);
  if (!form) {
    throw new Error(
      'Registration details were lost. Please register again from the start.'
    );
  }

  const mobileNumber = normalizeMobileDigits(form.mobileNumber);
  const emailAddress = form.emailAddress.trim().toLowerCase();
  const panNumber = form.panNumber.trim().toUpperCase();
  const ifscCode = form.ifscCode.trim().toUpperCase();
  const aadhaarNumber = form.aadhaarNumber.replace(/\D/g, '');
  const nomineeAadhaar = form.nomineeAadhaar.replace(/\D/g, '');
  const nomineeMobile = normalizeMobileDigits(form.nomineeMobile);
  const nomineePan = form.nomineePan.trim().toUpperCase();
  const accountNumber = form.accountNumber.replace(/\D/g, '');

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileLookupError) {
    throw new Error(profileLookupError.message);
  }

  if (!existingProfile) {
    const profileResult = await supabase.from('profiles').insert({
      user_id: userId,
      full_name: form.fullName.trim(),
      mobile_number: mobileNumber,
      email_address: emailAddress,
      date_of_birth: toIsoDate(form.dateOfBirth),
      address: form.address.trim(),
      authorized: form.authorized,
      mobile_verified: true,
    });

    if (profileResult.error) {
      const message = profileResult.error.message;
      if (!isDuplicateError(message)) {
        if (
          message.toLowerCase().includes('idx_profiles_email_mobile_combo')
        ) {
          throw new Error(
            'An account with this email and mobile number combination already exists.'
          );
        }
        throw new Error(message);
      }
    }
  }

  const { error: mpinError } = await supabase.rpc('set_own_mpin', {
    p_mpin: form.mpin,
  });
  if (mpinError) {
    throw new Error(mpinError.message);
  }

  const { data: existingKyc, error: kycLookupError } = await supabase
    .from('kyc_documents')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (kycLookupError) {
    throw new Error(kycLookupError.message);
  }

  if (!existingKyc) {
    // Admin migration 029 removed image path columns — insert numbers only.
    const kycResult = await supabase.from('kyc_documents').insert({
      user_id: userId,
      aadhaar_number: aadhaarNumber,
      pan_number: panNumber,
    });

    if (kycResult.error && !isDuplicateError(kycResult.error.message)) {
      throw new Error(kycResult.error.message);
    }
  }

  const { data: existingBank, error: bankLookupError } = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (bankLookupError) {
    throw new Error(bankLookupError.message);
  }

  if (!existingBank) {
    const bankResult = await supabase.from('bank_accounts').insert({
      user_id: userId,
      account_holder_name: form.accountHolderName.trim(),
      account_number: accountNumber,
      ifsc_code: ifscCode,
      bank_name: form.bankName.trim(),
      branch_name: form.branchName.trim(),
      account_type: form.accountType,
      is_primary: true,
    });

    if (bankResult.error && !isDuplicateError(bankResult.error.message)) {
      throw new Error(bankResult.error.message);
    }
  }

  const { data: existingNominee, error: nomineeLookupError } = await supabase
    .from('nominees')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (nomineeLookupError) {
    throw new Error(nomineeLookupError.message);
  }

  if (!existingNominee) {
    const nomineeResult = await supabase.from('nominees').insert({
      user_id: userId,
      nominee_name: form.nomineeName.trim(),
      relationship: form.relationship,
      nominee_aadhaar: nomineeAadhaar,
      nominee_mobile: nomineeMobile,
      nominee_pan: nomineePan,
    });

    if (nomineeResult.error && !isDuplicateError(nomineeResult.error.message)) {
      throw new Error(nomineeResult.error.message);
    }
  }

  await clearPendingRegistration(userId);
}

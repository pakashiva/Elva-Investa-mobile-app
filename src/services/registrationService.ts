import { parseDateOfBirth } from '../utils/formatDate';
import { RegistrationFormValues } from '../types/registrationForm';
import { signUpWithEmail } from './authService';
import { supabase } from '../lib/supabase';

export type RegistrationResult = {
  userId: string;
};

function toIsoDate(dateOfBirth: string): string {
  const date = parseDateOfBirth(dateOfBirth);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export async function registerUser(
  form: RegistrationFormValues
): Promise<RegistrationResult> {
  await assertEmailMobileComboAvailable(form.emailAddress, form.mobileNumber);

  const { session } = await signUpWithEmail(
    form.emailAddress,
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
    const profileResult = await supabase.from('profiles').insert({
      user_id: userId,
      full_name: form.fullName.trim(),
      mobile_number: form.mobileNumber.trim(),
      email_address: form.emailAddress.trim().toLowerCase(),
      date_of_birth: toIsoDate(form.dateOfBirth),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pin_code: form.pinCode.trim(),
      authorized: form.authorized,
      mobile_verified: false,
    });

    if (profileResult.error) {
      const message = profileResult.error.message.toLowerCase();
      if (message.includes('idx_profiles_email_mobile_combo') || message.includes('duplicate')) {
        throw new Error(
          'An account with this email and mobile number combination already exists.'
        );
      }
      throw new Error(profileResult.error.message);
    }

    const kycResult = await supabase.from('kyc_documents').insert({
      user_id: userId,
      aadhaar_number: form.aadhaarNumber.trim(),
      pan_number: form.panNumber.trim(),
      aadhaar_front_path: null,
      aadhaar_back_path: null,
      pan_card_path: null,
    });

    if (kycResult.error) {
      throw new Error(kycResult.error.message);
    }

    const bankResult = await supabase.from('bank_accounts').insert({
      user_id: userId,
      account_holder_name: form.accountHolderName.trim(),
      account_number: form.accountNumber.trim(),
      ifsc_code: form.ifscCode.trim().toUpperCase(),
      bank_name: form.bankName.trim(),
      account_type: form.accountType,
      is_primary: true,
    });

    if (bankResult.error) {
      throw new Error(bankResult.error.message);
    }

    const nomineeResult = await supabase.from('nominees').insert({
      user_id: userId,
      nominee_name: form.nomineeName.trim(),
      relationship: form.relationship,
      nominee_aadhaar: form.nomineeAadhaar.trim(),
      nominee_percentage: form.nomineePercentage.trim(),
    });

    if (nomineeResult.error) {
      throw new Error(nomineeResult.error.message);
    }

    return { userId };
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
}

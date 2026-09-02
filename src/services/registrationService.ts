import { parseDateOfBirth } from '../utils/formatDate';
import { RegistrationFormValues } from '../types/registrationForm';
import { signUpWithEmail } from './authService';
import {
  removeKycDocuments,
  uploadKycDocument,
} from './kycStorageService';
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

function assertDocumentSelected(
  label: string,
  document: RegistrationFormValues['aadhaarFront']
): string {
  if (!document.isUserSelected || !document.uri) {
    throw new Error(`${label} must be selected from your device before submitting.`);
  }
  return document.uri;
}

export async function registerUser(
  form: RegistrationFormValues
): Promise<RegistrationResult> {
  const aadhaarFrontUri = assertDocumentSelected(
    'Aadhaar front image',
    form.aadhaarFront
  );
  const aadhaarBackUri = assertDocumentSelected(
    'Aadhaar back image',
    form.aadhaarBack
  );
  const panCardUri = assertDocumentSelected('PAN card image', form.panCard);

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
  const uploadedPaths: string[] = [];

  try {
    const [aadhaarFrontPath, aadhaarBackPath, panCardPath] = await Promise.all([
      uploadKycDocument(
        userId,
        'aadhaar_front',
        aadhaarFrontUri,
        form.aadhaarFront.fileName
      ),
      uploadKycDocument(
        userId,
        'aadhaar_back',
        aadhaarBackUri,
        form.aadhaarBack.fileName
      ),
      uploadKycDocument(userId, 'pan_card', panCardUri, form.panCard.fileName),
    ]);

    uploadedPaths.push(aadhaarFrontPath, aadhaarBackPath, panCardPath);

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
      throw new Error(profileResult.error.message);
    }

    const kycResult = await supabase.from('kyc_documents').insert({
      user_id: userId,
      aadhaar_number: form.aadhaarNumber.trim(),
      pan_number: form.panNumber.trim(),
      aadhaar_front_path: aadhaarFrontPath,
      aadhaar_back_path: aadhaarBackPath,
      pan_card_path: panCardPath,
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
    if (uploadedPaths.length) {
      try {
        await removeKycDocuments(uploadedPaths);
      } catch {
        // Best-effort cleanup only.
      }
    }

    await supabase.auth.signOut();
    throw error;
  }
}

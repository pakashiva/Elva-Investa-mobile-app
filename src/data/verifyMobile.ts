/** Defaults for verify / MPIN / password reset screens */
export const VERIFY_MOBILE_DEFAULTS = {
  maskedMobile: '+91 98765XXXXX',
  otp: '',
  /** Seconds before "Resend OTP" is enabled again. */
  resendSeconds: 60,
  /** Fallback OTP validity when provider does not return expiresIn. */
  expiresSeconds: 300,
  newMpin: '',
  confirmMpin: '',
  newPassword: '',
  confirmPassword: '',
};

export const MPIN_REQUIREMENT_TEXT =
  'MPIN must be exactly 4 digits. You will use it to unlock the app on this device.';

export const PASSWORD_REQUIREMENT_TEXT =
  'Must be at least 8 characters with 1 uppercase, 1 number & 1 special character.';

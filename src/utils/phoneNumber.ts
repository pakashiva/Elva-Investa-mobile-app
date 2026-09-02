/** Normalize a stored mobile number for OTP API calls (prepend 91 once). */
export function normalizePhoneForOtp(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.startsWith('91')) {
    return digits;
  }

  return `91${digits}`;
}

/** Mask mobile for display, e.g. +91 98765XXXXX */
export function maskMobileNumber(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  const local = digits.startsWith('91') ? digits.slice(2) : digits;

  if (local.length < 5) {
    return mobile.trim() || '—';
  }

  const visible = local.slice(0, 5);
  return `+91 ${visible}XXXXX`;
}

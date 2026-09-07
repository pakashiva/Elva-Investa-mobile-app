/** Indian-standard registration field validators */

export function normalizeMobileDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function validateIndianMobile(raw: string): string | null {
  const digits = normalizeMobileDigits(raw);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return 'Enter a valid 10-digit Indian mobile number.';
  }
  return null;
}

export function validateEmailAddress(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validateAadhaarNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!/^\d{12}$/.test(digits)) {
    return 'Aadhaar number must be exactly 12 digits.';
  }
  return null;
}

export function validatePanNumber(raw: string): string | null {
  const pan = raw.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return 'Enter a valid PAN (e.g. ABCDE1234F).';
  }
  return null;
}

export function validateBankAccountNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!/^\d{9,18}$/.test(digits)) {
    return 'Bank account number must be 9–18 digits.';
  }
  return null;
}

export function validateIfscCode(raw: string): string | null {
  const ifsc = raw.trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    return 'Enter a valid IFSC code (e.g. HDFC0001234).';
  }
  return null;
}

/** Validates a 4-digit MPIN. Returns an error message or null if valid. */
export function validateMpin(mpin: string): string | null {
  const trimmed = mpin.trim();
  if (!trimmed) {
    return 'MPIN is required';
  }
  if (!/^\d{4}$/.test(trimmed)) {
    return 'MPIN must be exactly 4 digits';
  }
  return null;
}

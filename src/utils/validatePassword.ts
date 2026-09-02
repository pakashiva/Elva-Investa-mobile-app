export function validatePasswordComplexity(password: string): string | null {
  if (!password.trim()) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least 1 number';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least 1 special character';
  }

  return null;
}

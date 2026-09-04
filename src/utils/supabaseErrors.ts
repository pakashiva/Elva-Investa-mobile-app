function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return '';
}

/** Supabase/PostgREST error when a table or RPC has not been created yet (migration pending). */
export function isMissingTableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }
  return (
    message.includes('could not find the table') ||
    message.includes('schema cache') ||
    message.includes('could not find the function') ||
    (message.includes('relation') && message.includes('does not exist')) ||
    (message.includes('function') && message.includes('does not exist'))
  );
}

/**
 * True when the device clock is slightly behind Supabase auth servers,
 * so a freshly issued JWT looks "issued in the future".
 */
export function isJwtClockSkewError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }
  return (
    message.includes('jwt issued at future') ||
    message.includes('issued at future') ||
    message.includes('token used before issued')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an authenticated Supabase call when the first attempt fails due to
 * JWT clock skew right after login.
 */
export async function withJwtRetry<T>(
  operation: () => Promise<T>,
  options?: { retries?: number; delayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 3;
  const delayMs = options?.delayMs ?? 450;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isJwtClockSkewError(error) || attempt === retries) {
        throw error;
      }
      await delay(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}

export const MISSING_INVESTMENTS_TABLE_MESSAGE =
  'Investments backend is not set up yet. Ask your admin to run supabase/migrations/003_investments_withdrawals.sql in the Supabase SQL Editor.';

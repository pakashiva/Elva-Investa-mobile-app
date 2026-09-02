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

export const MISSING_INVESTMENTS_TABLE_MESSAGE =
  'Investments backend is not set up yet. Ask your admin to run supabase/migrations/003_investments_withdrawals.sql in the Supabase SQL Editor.';

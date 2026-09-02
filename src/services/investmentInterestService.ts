import { supabase } from '../lib/supabase';
import { isMissingTableError } from '../utils/supabaseErrors';

let processingPromise: Promise<void> | null = null;
let lastProcessedUserId: string | null = null;

/**
 * Atomically credits newly completed 30-day interest periods via Postgres RPC.
 * Safe to call multiple times — idempotent per period.
 */
export async function processUserInvestmentInterest(
  userId: string
): Promise<void> {
  if (processingPromise && lastProcessedUserId === userId) {
    return processingPromise;
  }

  lastProcessedUserId = userId;
  processingPromise = (async () => {
    try {
      const { error } = await supabase.rpc('process_user_investment_interest');

      if (error) {
        if (isMissingTableError(error)) {
          return;
        }
        throw new Error(error.message);
      }
    } finally {
      processingPromise = null;
    }
  })();

  return processingPromise;
}

export function resetInvestmentInterestProcessing(): void {
  processingPromise = null;
  lastProcessedUserId = null;
}

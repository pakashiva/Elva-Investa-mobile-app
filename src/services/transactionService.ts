import { supabase } from '../lib/supabase';
import { Transaction } from '../types/transaction';
import { isMissingTableError } from '../utils/supabaseErrors';
import { mapTransactionRow, TransactionRow } from '../utils/transactionFormat';

export async function getUserTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(
      'id, transaction_code, transaction_type, amount, investment_plan_id, reference_id, transaction_date'
    )
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapTransactionRow(row as TransactionRow));
}

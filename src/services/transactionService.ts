import { Transaction } from '../types/transaction';
import { mapTransactionRow, TransactionRow } from '../utils/transactionFormat';
import { apiRequest } from '../lib/api';

type TransactionApiRow = {
  id: string;
  transactionCode: string;
  transactionType: TransactionRow['transaction_type'];
  amount: number;
  investmentPlanId: string;
  referenceId: string | null;
  transactionDate: string;
};

export async function getUserTransactions(
  _userId?: string
): Promise<Transaction[]> {
  const data = await apiRequest<{ transactions: TransactionApiRow[] }>(
    '/api/mobile/transactions'
  );
  return (data.transactions ?? []).map((row) =>
    mapTransactionRow({
      id: row.id,
      transaction_code: row.transactionCode,
      transaction_type: row.transactionType,
      amount: row.amount,
      investment_plan_id: row.investmentPlanId,
      reference_id: row.referenceId,
      transaction_date: row.transactionDate,
    })
  );
}

export type TransactionDirection = 'credit' | 'debit';

export type TransactionType = 'instant_credit' | 'withdrawal';

export interface Transaction {
  id: string;
  date: string;
  txnId: string;
  amount: string;
  direction: TransactionDirection;
  planId: string;
  type: string;
  referenceId: string;
}

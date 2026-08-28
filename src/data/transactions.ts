export type TransactionDirection = 'credit' | 'debit';

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

/** Temporary dummy transactions — matches reference; replaced by backend later */
export const DUMMY_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    date: '15 Oct 2024',
    txnId: 'TXN-894721',
    amount: '+ ₹12,500',
    direction: 'credit',
    planId: 'INV-000142',
    type: 'Interest Credit',
    referenceId: 'IMPS-42891047812',
  },
  {
    id: 't2',
    date: '12 Oct 2024',
    txnId: 'TXN-891042',
    amount: '- ₹1,50,000',
    direction: 'debit',
    planId: 'INV-000145',
    type: 'Withdrawal',
    referenceId: 'NEFT-9082347101',
  },
  {
    id: 't3',
    date: '05 Oct 2024',
    txnId: 'TXN-890012',
    amount: '+ ₹26,667',
    direction: 'credit',
    planId: 'INV-000139',
    type: 'Interest Credit',
    referenceId: 'IMPS-42891011400',
  },
];

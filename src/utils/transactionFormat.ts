import { Transaction, TransactionType } from '../types/transaction';
import { formatInr } from './currency';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatTransactionDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = date.getDate().toString().padStart(2, '0');
  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case 'instant_credit':
      return 'Instant Credit';
    case 'referral_bonus':
      return 'Referral Bonus';
    case 'withdrawal':
      return 'Withdrawal';
    default:
      return type;
  }
}

export function formatTransactionAmount(
  type: TransactionType,
  amount: number
): { display: string; direction: 'credit' | 'debit' } {
  const formatted = formatInr(amount);
  if (type === 'instant_credit' || type === 'referral_bonus') {
    return { display: `+ ${formatted}`, direction: 'credit' };
  }
  return { display: `- ${formatted}`, direction: 'debit' };
}

export function formatReferenceId(referenceId: string | null): string {
  return referenceId?.trim() || '—';
}

export type TransactionRow = {
  id: string;
  transaction_code: string;
  transaction_type: TransactionType;
  amount: number;
  investment_plan_id: string;
  reference_id: string | null;
  transaction_date: string;
};

export function mapTransactionRow(row: TransactionRow): Transaction {
  const { display, direction } = formatTransactionAmount(
    row.transaction_type,
    Number(row.amount)
  );

  return {
    id: row.id,
    date: formatTransactionDate(row.transaction_date),
    txnId: row.transaction_code,
    amount: display,
    direction,
    planId: row.investment_plan_id,
    type: formatTransactionTypeLabel(row.transaction_type),
    referenceId: formatReferenceId(row.reference_id),
  };
}

import { BankAccount, Nominee } from '../types/fundRequest';

/** Temporary dummy options — will be replaced by backend later */
export const DUMMY_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'ba1', label: 'HDFC Bank •••• 4521' },
  { id: 'ba2', label: 'ICICI Bank •••• 8830' },
  { id: 'ba3', label: 'SBI •••• 1194' },
];

export const DUMMY_NOMINEES: Nominee[] = [
  { id: 'n1', name: 'Priya Sharma' },
  { id: 'n2', name: 'Rahul Venkatesh' },
  { id: 'n3', name: 'Ananya Iyer' },
];

/** Agreement charges shown in the payable info box (dummy) */
export const AGREEMENT_CHARGES = 1550;
export const FUND_AMOUNT_MINIMUM = 100000;

/**
 * Auto-selected paydate for New Fund Request.
 * Displayed in the Paydate field — user cannot change it in this flow.
 */
export function getAutoSelectedPaydate(baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  // Next business-day style placeholder: +3 days from today
  d.setDate(d.getDate() + 3);
  const day = d.getDate().toString().padStart(2, '0');
  const months = [
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
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatPayableBreakdown(fundAmountRaw: string): {
  displayTotal: string;
  detail: string;
} {
  const digits = fundAmountRaw.replace(/[^\d]/g, '');
  const amount = digits ? Number(digits) : 0;
  const total = amount + AGREEMENT_CHARGES;
  const formatInr = (n: number) =>
    `₹${n.toLocaleString('en-IN')}`;
  return {
    displayTotal: formatInr(total),
    detail: `(${amount.toLocaleString('en-IN')} + ${AGREEMENT_CHARGES.toLocaleString('en-IN')})`,
  };
}

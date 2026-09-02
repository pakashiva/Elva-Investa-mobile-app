/** Agreement charges shown in the payable info box */
export const AGREEMENT_CHARGES = 1550;
export const FUND_AMOUNT_MINIMUM = 100000;

/**
 * Auto-selected paydate for New Fund Request.
 * Displayed in the Paydate field — user cannot change it in this flow.
 */
export function getAutoSelectedPaydate(baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
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
  const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return {
    displayTotal: formatInr(total),
    detail: `(${amount.toLocaleString('en-IN')} + ${AGREEMENT_CHARGES.toLocaleString('en-IN')})`,
  };
}

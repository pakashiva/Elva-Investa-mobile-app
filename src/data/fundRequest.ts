/** Agreement charges shown in the payable info box */
export const AGREEMENT_CHARGES = 1000;
export const FUND_AMOUNT_MINIMUM = 100000;

const MONTH_LABELS = [
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
] as const;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Next payout date = same calendar day next month.
 * If that day does not exist (e.g. Jan 31 → Feb), use the 1st of the month after next
 * (Jan 31 → Mar 1).
 */
export function getNextMonthPayDate(baseDate: Date = new Date()): Date {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const nextMonthIndex = month + 1;
  const nextYear = year + Math.floor(nextMonthIndex / 12);
  const normalizedNextMonth = ((nextMonthIndex % 12) + 12) % 12;
  const maxDay = daysInMonth(nextYear, normalizedNextMonth);

  if (day > maxDay) {
    // 1st of the month after next
    const afterNextIndex = month + 2;
    const afterNextYear = year + Math.floor(afterNextIndex / 12);
    const normalizedAfterNext = ((afterNextIndex % 12) + 12) % 12;
    return new Date(afterNextYear, normalizedAfterNext, 1);
  }

  return new Date(nextYear, normalizedNextMonth, day);
}

function formatPaydateDisplay(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Auto-selected paydate for New Fund Request (one month from today).
 * Displayed in the Paydate field — user cannot change it in this flow.
 */
export function getAutoSelectedPaydate(baseDate: Date = new Date()): string {
  return formatPaydateDisplay(getNextMonthPayDate(baseDate));
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

import { formatInr } from './currency';

/** Formats decimal rate (0.05) as "5.0% p.m." */
export function formatInterestRateMonthly(rate: number): string {
  const percent = rate * 100;
  const display = Number.isInteger(percent)
    ? percent.toFixed(0)
    : percent.toFixed(1);
  return `${display}% p.m.`;
}

export function mapInvestmentAmounts(row: {
  fund_amount: number;
  total_earnings?: number | null;
  tds_deducted_amount?: number | null;
  interest_rate?: number | null;
}): {
  principal: number;
  totalEarnings: number;
  tdsDeducted: number;
  currentValue: number;
  yieldRate: string;
  invested: string;
  currentValueDisplay: string;
  earnedInterest: string;
  tdsDeductedDisplay: string;
  netEarned: string;
} {
  const principal = Number(row.fund_amount);
  const totalEarnings = Number(row.total_earnings ?? 0);
  const tdsDeducted = Number(row.tds_deducted_amount ?? 0);
  const interestRate = Number(row.interest_rate ?? 0.05);
  const currentValue = principal + totalEarnings;

  return {
    principal,
    totalEarnings,
    tdsDeducted,
    currentValue,
    yieldRate: formatInterestRateMonthly(interestRate),
    invested: formatInr(principal),
    currentValueDisplay: formatInr(currentValue),
    earnedInterest: formatInr(totalEarnings),
    tdsDeductedDisplay: formatInr(tdsDeducted),
    netEarned: formatInr(totalEarnings),
  };
}

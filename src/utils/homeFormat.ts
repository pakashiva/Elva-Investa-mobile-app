export function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '0%';
  }
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted}%`;
}

export function formatGainFooter(gainPercent: number): string {
  const sign = gainPercent > 0 ? '+' : '';
  return `${sign}${formatPercent(gainPercent)} total gain`;
}

export function formatInvestmentCountFooter(count: number): string {
  if (count === 0) {
    return 'across 0 investments';
  }
  return `across ${count} investment${count === 1 ? '' : 's'}`;
}

export function formatPaidWithdrawalFooter(count: number): string {
  if (count === 0) {
    return 'No paid withdrawals';
  }
  return `${count} paid withdrawal${count === 1 ? '' : 's'}`;
}

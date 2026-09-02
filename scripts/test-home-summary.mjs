/**
 * Unit tests for Home summary calculations.
 * Run: node scripts/test-home-summary.mjs
 */

function calculateHomeSummary(activeInvestments, paidWithdrawals) {
  const totalInvested = activeInvestments.reduce(
    (sum, row) => sum + Number(row.fund_amount),
    0
  );
  const currentTotalReturns = activeInvestments.reduce(
    (sum, row) => sum + Number(row.total_earnings ?? 0),
    0
  );
  const totalGainPercent =
    totalInvested > 0 ? (currentTotalReturns / totalInvested) * 100 : 0;

  const totalWithdrawals = paidWithdrawals.reduce((sum, row) => {
    const amount =
      row.net_payout != null ? Number(row.net_payout) : Number(row.withdrawal_amount);
    return sum + amount;
  }, 0);

  return {
    totalInvested,
    activeInvestmentCount: activeInvestments.length,
    currentTotalReturns,
    totalGainPercent,
    maturityValue: totalInvested + currentTotalReturns,
    totalWithdrawals,
    paidWithdrawalCount: paidWithdrawals.length,
  };
}

function assertClose(actual, expected, label) {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

console.log('TEST — Expected Home calculation example');
const summary = calculateHomeSummary(
  [
    { fund_amount: 250000, total_earnings: 11250 },
    { fund_amount: 300000, total_earnings: 22500 },
  ],
  [{ net_payout: 100000, withdrawal_amount: 100000 }]
);

assertClose(summary.totalInvested, 550000, 'Total Invested');
assertClose(summary.activeInvestmentCount, 2, 'Active count');
assertClose(summary.currentTotalReturns, 33750, 'Current Returns');
assertClose(summary.totalGainPercent, 6.136363636363636, 'Gain %');
assertClose(summary.maturityValue, 583750, 'Maturity Value');
assertClose(summary.totalWithdrawals, 100000, 'Total Withdrawals');
assertClose(summary.paidWithdrawalCount, 1, 'Paid withdrawal count');
console.log('  PASS');

console.log('TEST — Pending/Closed excluded from investments');
const noPending = calculateHomeSummary(
  [
    { fund_amount: 250000, total_earnings: 11250 },
    { fund_amount: 300000, total_earnings: 22500 },
  ],
  []
);
assertClose(noPending.totalInvested, 550000, 'Only active included');
console.log('  PASS');

console.log('TEST — Processing/Rejected excluded from withdrawals');
const onlyPaid = calculateHomeSummary([], [{ net_payout: 100000, withdrawal_amount: 100000 }]);
assertClose(onlyPaid.totalWithdrawals, 100000, 'Paid only');
assertClose(onlyPaid.paidWithdrawalCount, 1, 'Paid count');
console.log('  PASS');

console.log('TEST — Empty user');
const empty = calculateHomeSummary([], []);
assertClose(empty.totalInvested, 0, 'Total Invested');
assertClose(empty.totalGainPercent, 0, 'Gain %');
assertClose(empty.maturityValue, 0, 'Maturity');
console.log('  PASS');

console.log('\nAll Home summary unit tests passed.');

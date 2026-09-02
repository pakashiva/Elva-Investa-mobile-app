/**
 * Unit tests for 30-day simple interest accrual logic.
 * Run: node scripts/test-investment-interest.mjs
 */

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function calculateAccrual({
  principal,
  interestRate,
  tdsPercent,
  investedDate,
  asOfDate,
  completedInterestPeriods,
}) {
  const daysPassed = daysBetween(investedDate, asOfDate);
  if (daysPassed < 30) {
    return {
      daysPassed,
      completedPeriods: 0,
      newPeriods: 0,
      tdsDeducted: 0,
      totalEarnings: 0,
      currentValue: principal,
      completedInterestPeriods,
    };
  }

  const completedPeriods = Math.floor(daysPassed / 30);
  const newPeriods = completedPeriods - completedInterestPeriods;
  if (newPeriods <= 0) {
    const monthlyInterest = principal * interestRate;
    const monthlyTds = monthlyInterest * tdsPercent;
    const monthlyNet = monthlyInterest - monthlyTds;
    const totalEarnings = monthlyNet * completedInterestPeriods;
    const tdsDeducted = monthlyTds * completedInterestPeriods;
    return {
      daysPassed,
      completedPeriods,
      newPeriods: 0,
      tdsDeducted,
      totalEarnings,
      currentValue: principal + totalEarnings,
      completedInterestPeriods,
    };
  }

  const monthlyInterest = principal * interestRate;
  const monthlyTds = monthlyInterest * tdsPercent;
  const monthlyNet = monthlyInterest - monthlyTds;

  const priorTds = monthlyTds * completedInterestPeriods;
  const priorEarnings = monthlyNet * completedInterestPeriods;

  const tdsDeducted = priorTds + monthlyTds * newPeriods;
  const totalEarnings = priorEarnings + monthlyNet * newPeriods;

  return {
    daysPassed,
    completedPeriods,
    newPeriods,
    tdsDeducted,
    totalEarnings,
    currentValue: principal + totalEarnings,
    completedInterestPeriods: completedPeriods,
  };
}

function assertClose(actual, expected, label) {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function runTests() {
  const principal = 250000;
  const interestRate = 0.05;
  const tdsPercent = 0.1;
  const investedDate = '2026-01-01';

  console.log('TEST 1 — NEW INVESTMENT (< 30 days)');
  const test1 = calculateAccrual({
    principal,
    interestRate,
    tdsPercent,
    investedDate,
    asOfDate: '2026-01-15',
    completedInterestPeriods: 0,
  });
  assertClose(test1.tdsDeducted, 0, 'TDS');
  assertClose(test1.totalEarnings, 0, 'Total Earnings');
  assertClose(test1.newPeriods, 0, 'New periods');
  console.log('  PASS');

  console.log('TEST 2 — EXACTLY ONE MONTH (30 days)');
  const test2 = calculateAccrual({
    principal,
    interestRate,
    tdsPercent,
    investedDate,
    asOfDate: '2026-01-31',
    completedInterestPeriods: 0,
  });
  assertClose(test2.tdsDeducted, 1250, 'TDS');
  assertClose(test2.totalEarnings, 11250, 'Total Earnings');
  assertClose(test2.currentValue, 261250, 'Current Value');
  assertClose(test2.newPeriods, 1, 'New periods');
  console.log('  PASS');

  console.log('TEST 3 — 31 DAYS (no double count if period already processed)');
  const test3 = calculateAccrual({
    principal,
    interestRate,
    tdsPercent,
    investedDate,
    asOfDate: '2026-02-01',
    completedInterestPeriods: 1,
  });
  assertClose(test3.tdsDeducted, 1250, 'TDS');
  assertClose(test3.totalEarnings, 11250, 'Total Earnings');
  assertClose(test3.newPeriods, 0, 'New periods');
  console.log('  PASS');

  console.log('TEST 4 — TWO COMPLETED PERIODS (60 days)');
  const test4 = calculateAccrual({
    principal,
    interestRate,
    tdsPercent,
    investedDate,
    asOfDate: '2026-03-02',
    completedInterestPeriods: 0,
  });
  assertClose(test4.tdsDeducted, 2500, 'TDS');
  assertClose(test4.totalEarnings, 22500, 'Total Earnings');
  assertClose(test4.currentValue, 272500, 'Current Value');
  assertClose(test4.newPeriods, 2, 'New periods');
  console.log('  PASS');

  console.log('TEST 5 — MULTIPLE INVESTMENTS (independent)');
  const invA = calculateAccrual({
    principal: 250000,
    interestRate: 0.05,
    tdsPercent: 0.1,
    investedDate: '2026-01-01',
    asOfDate: '2026-01-31',
    completedInterestPeriods: 0,
  });
  const invB = calculateAccrual({
    principal: 300000,
    interestRate: 0.05,
    tdsPercent: 0.1,
    investedDate: '2026-01-01',
    asOfDate: '2026-01-31',
    completedInterestPeriods: 0,
  });
  assertClose(invA.totalEarnings, 11250, 'Investment A earnings');
  assertClose(invB.totalEarnings, 13500, 'Investment B earnings');
  console.log('  PASS');

  console.log('\nAll investment interest unit tests passed.');
}

runTests();

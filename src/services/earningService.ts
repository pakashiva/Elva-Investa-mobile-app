import { formatInr } from '../utils/currency';
import { MonthlyEarning } from '../types/earning';
import { apiRequest } from '../lib/api';

type InvestmentApiRow = {
  id: string;
  name: string;
  code: string;
  fundAmount: number;
  interestRate: number;
  tdsPercent: number;
  completedInterestPeriods: number;
  investedDate: string | null;
  status: string;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateLabel(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

function expandInvestmentPeriods(row: InvestmentApiRow): MonthlyEarning[] {
  const periods = Math.max(0, Math.floor(Number(row.completedInterestPeriods) || 0));
  if (periods <= 0 || !row.investedDate) {
    return [];
  }

  const principal = Number(row.fundAmount) || 0;
  const rate = Number(row.interestRate) || 0;
  const tdsRate = Number(row.tdsPercent) || 0;
  const gross = round2(principal * rate);
  const tds = round2(gross * tdsRate);
  const net = round2(gross - tds);
  const start = parseDateOnly(row.investedDate);
  const investmentName = (row.name ?? '').trim() || 'Investment';
  const investmentCode = (row.code ?? '').trim() || row.id.slice(0, 8).toUpperCase();

  const rows: MonthlyEarning[] = [];
  for (let i = 1; i <= periods; i += 1) {
    const periodEnd = addDays(start, i * 30);
    rows.push({
      id: `${row.id}:${i}`,
      investmentId: row.id,
      investmentName,
      investmentCode,
      periodIndex: i,
      monthLabel: formatMonthLabel(periodEnd),
      periodEndLabel: formatDateLabel(periodEnd),
      principal,
      principalLabel: formatInr(principal),
      interestRatePercent: round2(rate * 100),
      interestEarned: gross,
      interestEarnedLabel: formatInr(gross),
      tdsDeducted: tds,
      tdsDeductedLabel: formatInr(tds),
      netPayout: net,
      netPayoutLabel: formatInr(net),
      bankName: '—',
      bankMaskedNumber: '—',
      bankIfsc: '—',
      bankAccountType: '—',
    });
  }

  return rows;
}

export async function getUserMonthlyEarnings(
  _userId?: string
): Promise<MonthlyEarning[]> {
  const data = await apiRequest<{ investments: InvestmentApiRow[] }>(
    '/api/mobile/investments'
  );
  const expanded = (data.investments ?? []).flatMap(expandInvestmentPeriods);
  expanded.sort((a, b) => {
    const [ad, am, ay] = a.periodEndLabel.split('/').map(Number);
    const [bd, bm, by] = b.periodEndLabel.split('/').map(Number);
    const aTime = new Date(ay, (am || 1) - 1, ad || 1).getTime();
    const bTime = new Date(by, (bm || 1) - 1, bd || 1).getTime();
    return bTime - aTime;
  });
  return expanded;
}

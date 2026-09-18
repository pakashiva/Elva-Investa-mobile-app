import { supabase } from '../lib/supabase';
import { processUserInvestmentInterest } from './investmentInterestService';
import { formatInr } from '../utils/currency';
import { isMissingTableError } from '../utils/supabaseErrors';
import { MonthlyEarning } from '../types/earning';

type BankJoin = {
  id: string;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  account_type: string | null;
};

type InvestmentEarningRow = {
  id: string;
  name: string | null;
  code: string | null;
  request_id: string | null;
  fund_amount: number | string;
  interest_rate: number | string;
  tds_percent: number | string;
  completed_interest_periods: number | string | null;
  invested_date: string | null;
  status: string;
  bank_accounts: BankJoin | BankJoin[] | null;
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

function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '****';
  return `**** ${last4}`;
}

function unwrapBank(value: InvestmentEarningRow['bank_accounts']): BankJoin | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function expandInvestmentPeriods(row: InvestmentEarningRow): MonthlyEarning[] {
  const periods = Math.max(0, Math.floor(Number(row.completed_interest_periods) || 0));
  if (periods <= 0 || !row.invested_date) {
    return [];
  }

  const principal = Number(row.fund_amount) || 0;
  const rate = Number(row.interest_rate) || 0;
  const tdsRate = Number(row.tds_percent) || 0;
  const gross = round2(principal * rate);
  const tds = round2(gross * tdsRate);
  const net = round2(gross - tds);
  const start = parseDateOnly(row.invested_date);
  const bank = unwrapBank(row.bank_accounts);
  const investmentName = (row.name ?? '').trim() || 'Investment';
  const investmentCode =
    (row.code ?? '').trim() ||
    (row.request_id ?? '').trim() ||
    row.id.slice(0, 8).toUpperCase();

  const bankName = (bank?.bank_name ?? '').trim() || '—';
  const bankMasked = bank?.account_number
    ? maskAccountNumber(bank.account_number)
    : '—';
  const bankIfsc = (bank?.ifsc_code ?? '').trim() || '—';
  const bankAccountType =
    bank?.account_type === 'Current' ? 'Current' : bank?.account_type ? 'Savings' : '—';

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
      bankName,
      bankMaskedNumber: bankMasked,
      bankIfsc,
      bankAccountType,
    });
  }

  return rows;
}

/**
 * Monthly interest credits derived from completed 30-day periods on investments.
 * Runs interest RPC first so newly due periods appear.
 */
export async function getUserMonthlyEarnings(
  userId: string
): Promise<MonthlyEarning[]> {
  try {
    await processUserInvestmentInterest(userId);
  } catch {
    // Still load existing credited periods if accrual RPC fails.
  }

  const { data, error } = await supabase
    .from('investments')
    .select(
      `
      id,
      name,
      code,
      request_id,
      fund_amount,
      interest_rate,
      tds_percent,
      completed_interest_periods,
      invested_date,
      status,
      bank_accounts (
        id,
        bank_name,
        account_number,
        ifsc_code,
        account_type
      )
    `
    )
    .eq('user_id', userId)
    .gt('completed_interest_periods', 0)
    .order('invested_date', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as InvestmentEarningRow[];
  const expanded = rows.flatMap(expandInvestmentPeriods);

  // Newest period first
  expanded.sort((a, b) => {
    const [ad, am, ay] = a.periodEndLabel.split('/').map(Number);
    const [bd, bm, by] = b.periodEndLabel.split('/').map(Number);
    const aTime = new Date(ay, (am || 1) - 1, ad || 1).getTime();
    const bTime = new Date(by, (bm || 1) - 1, bd || 1).getTime();
    return bTime - aTime;
  });

  return expanded;
}

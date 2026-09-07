import { processUserInvestmentInterest } from './investmentInterestService';
import { supabase } from '../lib/supabase';
import { formatInterestRateMonthly } from '../utils/investmentFormat';
import {
  isMissingTableError,
  withJwtRetry,
} from '../utils/supabaseErrors';

export type PerformanceRange = '1Y' | 'ALL';

export type ChartPoint = {
  /** 0–1 along X axis */
  x: number;
  /** 0–1 along Y axis where 0 is top (higher values) */
  y: number;
};

export type PerformanceSeries = {
  points: ChartPoint[];
  bestPerformerLabel: string;
  averageReturnLabel: string;
  hasData: boolean;
};

type InvestmentRow = {
  name: string;
  fund_amount: number;
  total_earnings: number | null;
  interest_rate: number;
  invested_date: string | null;
  pay_date: string | null;
  completed_interest_periods: number;
  tds_percent: number;
};

const EMPTY_SERIES: PerformanceSeries = {
  points: [
    { x: 0, y: 0.55 },
    { x: 0.35, y: 0.55 },
    { x: 0.7, y: 0.55 },
    { x: 1, y: 0.55 },
  ],
  bestPerformerLabel: 'No active investments',
  averageReturnLabel: '—',
  hasData: false,
};

function portfolioValueAt(
  investments: InvestmentRow[],
  atMs: number
): number {
  let total = 0;
  for (const inv of investments) {
    if (!inv.invested_date) continue;
    const startMs = new Date(inv.invested_date).getTime();
    if (Number.isNaN(startMs) || startMs > atMs) continue;

    const payMs = inv.pay_date
      ? new Date(`${inv.pay_date}T00:00:00`).getTime()
      : NaN;
    const principal = Number(inv.fund_amount);
    const days = Math.floor((atMs - startMs) / (1000 * 60 * 60 * 24));
    const payDateReached = Number.isNaN(payMs) || atMs >= payMs;
    const eligiblePeriods =
      payDateReached && days >= 30 ? Math.floor(days / 30) : 0;
    const periods = Math.min(
      Math.max(eligiblePeriods, 0),
      Math.max(inv.completed_interest_periods, 0)
    );
    const monthlyNet =
      principal * Number(inv.interest_rate) * (1 - Number(inv.tds_percent));
    total += principal + monthlyNet * periods;
  }
  return total;
}

function buildSeriesFromInvestments(
  investments: InvestmentRow[],
  range: PerformanceRange
): PerformanceSeries {
  if (investments.length === 0) {
    return EMPTY_SERIES;
  }

  const now = Date.now();
  const startDates = investments
    .map((inv) =>
      inv.invested_date ? new Date(inv.invested_date).getTime() : NaN
    )
    .filter((ms) => !Number.isNaN(ms));

  if (startDates.length === 0) {
    const totalNow = investments.reduce(
      (sum, inv) =>
        sum + Number(inv.fund_amount) + Number(inv.total_earnings ?? 0),
      0
    );
    const points: ChartPoint[] =
      totalNow <= 0
        ? EMPTY_SERIES.points
        : [
            { x: 0, y: 0.62 },
            { x: 0.5, y: 0.4 },
            { x: 1, y: 0.22 },
          ];
    return {
      points,
      bestPerformerLabel: pickBestPerformer(investments),
      averageReturnLabel: formatAverageReturn(investments),
      hasData: true,
    };
  }

  const earliest = Math.min(...startDates);
  const windowStart =
    range === '1Y'
      ? Math.max(earliest, now - 365 * 24 * 60 * 60 * 1000)
      : earliest;

  const sampleCount = 8;
  const values: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const t = windowStart + ((now - windowStart) * i) / (sampleCount - 1);
    values.push(portfolioValueAt(investments, t));
  }

  // Ensure last point matches current book value when possible
  const currentBook = investments.reduce(
    (sum, inv) =>
      sum + Number(inv.fund_amount) + Number(inv.total_earnings ?? 0),
    0
  );
  if (currentBook > 0) {
    values[values.length - 1] = currentBook;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const points: ChartPoint[] = values.map((value, index) => {
    const x = index / (sampleCount - 1);
    const normalized = span > 0 ? (value - min) / span : 0.5;
    // Invert: higher portfolio value → lower Y (closer to top)
    const y = 0.78 - normalized * 0.62;
    return { x, y };
  });

  return {
    points,
    bestPerformerLabel: pickBestPerformer(investments),
    averageReturnLabel: formatAverageReturn(investments),
    hasData: true,
  };
}

function pickBestPerformer(investments: InvestmentRow[]): string {
  let best = investments[0];
  let bestScore = -1;
  for (const inv of investments) {
    const principal = Number(inv.fund_amount);
    if (principal <= 0) continue;
    const score = Number(inv.total_earnings ?? 0) / principal;
    if (score > bestScore) {
      bestScore = score;
      best = inv;
    }
  }
  const name = best.name?.trim() || 'Investment';
  return `${name} (${formatInterestRateMonthly(Number(best.interest_rate))})`;
}

function formatAverageReturn(investments: InvestmentRow[]): string {
  const totalPrincipal = investments.reduce(
    (sum, inv) => sum + Number(inv.fund_amount),
    0
  );
  if (totalPrincipal <= 0) {
    return '—';
  }
  const weighted = investments.reduce((sum, inv) => {
    const principal = Number(inv.fund_amount);
    return sum + principal * Number(inv.interest_rate);
  }, 0);
  const avgRate = weighted / totalPrincipal;
  return `${formatInterestRateMonthly(avgRate)} avg`;
}

async function fetchPerformanceSeries(
  userId: string,
  range: PerformanceRange
): Promise<PerformanceSeries> {
  await processUserInvestmentInterest(userId);

  const { data, error } = await supabase
    .from('investments')
    .select(
      'name, fund_amount, total_earnings, interest_rate, invested_date, pay_date, completed_interest_periods, tds_percent'
    )
    .eq('user_id', userId)
    .eq('status', 'Active');

  if (error) {
    if (isMissingTableError(error)) {
      return EMPTY_SERIES;
    }
    throw new Error(error.message);
  }

  return buildSeriesFromInvestments(data ?? [], range);
}

export async function getPerformanceSeries(
  userId: string,
  range: PerformanceRange
): Promise<PerformanceSeries> {
  return withJwtRetry(() => fetchPerformanceSeries(userId, range));
}

/** Exported for tests */
export { buildSeriesFromInvestments, EMPTY_SERIES };

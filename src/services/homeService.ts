import { apiRequest } from '../lib/api';

export type HomeSummary = {
  totalInvested: number;
  activeInvestmentCount: number;
  currentTotalReturns: number;
  totalGainPercent: number;
  maturityValue: number;
  totalWithdrawals: number;
  paidWithdrawalCount: number;
};

export type HomeChartInvestment = {
  name: string;
  fundAmount: number;
  totalEarnings: number;
  interestRate: number;
  investedDate: string | null;
  completedInterestPeriods: number;
  tdsPercent: number;
};

export type HomeDashboard = {
  summary: HomeSummary;
  chartInvestments: HomeChartInvestment[];
};

export const EMPTY_HOME_SUMMARY: HomeSummary = {
  totalInvested: 0,
  activeInvestmentCount: 0,
  currentTotalReturns: 0,
  totalGainPercent: 0,
  maturityValue: 0,
  totalWithdrawals: 0,
  paidWithdrawalCount: 0,
};

export async function getHomeDashboard(): Promise<HomeDashboard> {
  const data = await apiRequest<HomeDashboard>('/api/mobile/home');
  return {
    summary: {
      ...EMPTY_HOME_SUMMARY,
      ...(data.summary ?? {}),
    },
    chartInvestments: data.chartInvestments ?? [],
  };
}

export async function getHomeSummary(
  _userId?: string
): Promise<HomeSummary> {
  const dashboard = await getHomeDashboard();
  return dashboard.summary;
}

function calculateHomeSummary(
  activeInvestments: { fund_amount: number; total_earnings: number | null }[],
  paidWithdrawals: { net_payout: number | null; withdrawal_amount: number }[]
): HomeSummary {
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

/** Exported for unit tests */
export { calculateHomeSummary };

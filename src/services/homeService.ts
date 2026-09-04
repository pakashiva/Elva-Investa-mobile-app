import { supabase } from '../lib/supabase';
import { processUserInvestmentInterest } from './investmentInterestService';
import {
  isMissingTableError,
  withJwtRetry,
} from '../utils/supabaseErrors';

export type HomeSummary = {
  totalInvested: number;
  activeInvestmentCount: number;
  currentTotalReturns: number;
  totalGainPercent: number;
  maturityValue: number;
  totalWithdrawals: number;
  paidWithdrawalCount: number;
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

async function fetchHomeSummary(userId: string): Promise<HomeSummary> {
  await processUserInvestmentInterest(userId);

  const [investmentsResult, withdrawalsResult] = await Promise.all([
    supabase
      .from('investments')
      .select('fund_amount, total_earnings')
      .eq('user_id', userId)
      .eq('status', 'Active'),
    supabase
      .from('withdrawals')
      .select('net_payout, withdrawal_amount')
      .eq('user_id', userId)
      .eq('status', 'Paid'),
  ]);

  if (investmentsResult.error) {
    if (isMissingTableError(investmentsResult.error)) {
      return EMPTY_HOME_SUMMARY;
    }
    throw new Error(investmentsResult.error.message);
  }

  if (withdrawalsResult.error) {
    if (isMissingTableError(withdrawalsResult.error)) {
      return calculateHomeSummary(investmentsResult.data ?? [], []);
    }
    throw new Error(withdrawalsResult.error.message);
  }

  return calculateHomeSummary(
    investmentsResult.data ?? [],
    withdrawalsResult.data ?? []
  );
}

export async function getHomeSummary(userId: string): Promise<HomeSummary> {
  return withJwtRetry(() => fetchHomeSummary(userId));
}

/** Exported for unit tests */
export { calculateHomeSummary };

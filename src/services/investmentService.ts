import { AGREEMENT_CHARGES, FUND_AMOUNT_MINIMUM } from '../data/fundRequest';
import { Investment, InvestmentStatus } from '../types/investment';
import { mapInvestmentAmounts } from '../utils/investmentFormat';
import { apiRequest } from '../lib/api';
import { normalizeReferralCodeInput } from './referralService';

export type InvestmentRow = {
  id: string;
  code: string;
  requestId?: string | null;
  name: string;
  status: string;
  fundAmount: number;
  currentValue: number;
  interestRate: number;
  tdsPercent: number;
  totalEarnings: number;
  tdsDeductedAmount: number;
  investedDate: string | null;
  completedInterestPeriods: number;
  createdAt: string;
};

export type ActiveInvestmentOption = {
  id: string;
  label: string;
  code: string;
  name: string;
  principal: number;
  totalEarnings: number;
  withdrawalAmount: number;
  openPartialAmount: number;
  hasOpenFullWithdrawal: boolean;
  availablePrincipal: number;
};

export type CreateFundRequestInput = {
  userId: string;
  title: string;
  fundAmount: number;
  bankAccountId: string;
  nomineeId: string;
  payDate: string;
  referralCode?: string;
};

function mapStatus(status: string): InvestmentStatus {
  if (status === 'Active' || status === 'Closed') {
    return status;
  }
  return 'Pending';
}

function mapApiInvestment(row: InvestmentRow): Investment {
  const amounts = mapInvestmentAmounts({
    fund_amount: row.fundAmount,
    total_earnings: row.totalEarnings,
    tds_deducted_amount: row.tdsDeductedAmount,
    interest_rate: row.interestRate,
  });

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    detailSubtitle: `${row.name} Investment`,
    status: mapStatus(row.status),
    invested: amounts.invested,
    currentValue: amounts.currentValueDisplay,
    yieldRate: amounts.yieldRate,
    earnedInterest: amounts.earnedInterest,
    tdsDeducted: amounts.tdsDeductedDisplay,
    netEarned: amounts.netEarned,
  };
}

export function validateFundAmount(amount: number): string | null {
  if (!amount || amount < FUND_AMOUNT_MINIMUM) {
    return `Minimum fund amount is ₹${FUND_AMOUNT_MINIMUM.toLocaleString('en-IN')}.`;
  }
  return null;
}

export async function getUserInvestments(
  _userId?: string
): Promise<Investment[]> {
  const data = await apiRequest<{ investments: InvestmentRow[] }>(
    '/api/mobile/investments'
  );
  return (data.investments ?? []).map(mapApiInvestment);
}

export async function getInvestmentByIdForUser(
  _userId: string,
  investmentId: string
): Promise<Investment | null> {
  try {
    const data = await apiRequest<{ investment: InvestmentRow }>(
      `/api/mobile/investments/${investmentId}`
    );
    return data.investment ? mapApiInvestment(data.investment) : null;
  } catch {
    return null;
  }
}

export async function getActiveInvestmentsForWithdrawal(
  _userId?: string
): Promise<ActiveInvestmentOption[]> {
  const data = await apiRequest<{ funds: ActiveInvestmentOption[] }>(
    '/api/mobile/withdrawal-options'
  );
  return data.funds ?? [];
}

export async function getActiveInvestmentForUser(
  userId: string,
  investmentId: string
): Promise<ActiveInvestmentOption | null> {
  const funds = await getActiveInvestmentsForWithdrawal(userId);
  return funds.find((fund) => fund.id === investmentId) ?? null;
}

export async function getUserInvestmentTitles(
  _userId?: string
): Promise<string[]> {
  const data = await apiRequest<{
    titles?: string[];
  }>('/api/mobile/fund-options');
  return data.titles ?? [];
}

export async function createFundRequest(
  input: CreateFundRequestInput
): Promise<Investment> {
  const amountError = validateFundAmount(input.fundAmount);
  if (amountError) {
    throw new Error(amountError);
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error('Fund title is required.');
  }

  const data = await apiRequest<{ investment: InvestmentRow }>(
    '/api/mobile/investments',
    {
      method: 'POST',
      body: JSON.stringify({
        title,
        fundAmount: input.fundAmount,
        bankAccountId: input.bankAccountId,
        nomineeId: input.nomineeId,
        payDate: input.payDate,
        referralCode: input.referralCode
          ? normalizeReferralCodeInput(input.referralCode).toUpperCase()
          : '',
      }),
    }
  );

  return mapApiInvestment(data.investment);
}

export { AGREEMENT_CHARGES };

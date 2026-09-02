import { supabase } from '../lib/supabase';
import { AGREEMENT_CHARGES, FUND_AMOUNT_MINIMUM } from '../data/fundRequest';
import { Investment, InvestmentStatus } from '../types/investment';
import { mapInvestmentAmounts } from '../utils/investmentFormat';
import { processUserInvestmentInterest } from './investmentInterestService';

export type InvestmentRow = {
  id: string;
  user_id: string;
  code: string;
  name: string;
  detail_subtitle: string | null;
  status: InvestmentStatus;
  fund_amount: number;
  current_value: number | null;
  interest_rate: number;
  total_earnings: number;
  tds_deducted_amount: number;
  completed_interest_periods: number;
  invested_date: string | null;
  yield_rate: string | null;
  earned_interest: string | null;
  tds_deducted: string | null;
  net_earned: string | null;
  bank_account_id: string;
  nominee_id: string;
  pay_date: string;
  referral_code: string | null;
  agreement_charges: number;
  created_at: string;
  updated_at: string;
};

export type ActiveInvestmentOption = {
  id: string;
  label: string;
  code: string;
  name: string;
  withdrawalAmount: number;
};

export type CreateFundRequestInput = {
  userId: string;
  fundAmount: number;
  bankAccountId: string;
  nomineeId: string;
  payDate: string;
  referralCode?: string;
};

function mapInvestmentRow(row: InvestmentRow): Investment {
  const amounts = mapInvestmentAmounts(row);

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    detailSubtitle: row.detail_subtitle ?? `${row.name} Investment`,
    status: row.status,
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

export async function getUserInvestments(userId: string): Promise<Investment[]> {
  await processUserInvestmentInterest(userId);

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapInvestmentRow(row as InvestmentRow));
}

export async function getInvestmentByIdForUser(
  userId: string,
  investmentId: string
): Promise<Investment | null> {
  await processUserInvestmentInterest(userId);

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .eq('id', investmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapInvestmentRow(data as InvestmentRow);
}

export async function getActiveInvestmentsForWithdrawal(
  userId: string
): Promise<ActiveInvestmentOption[]> {
  await processUserInvestmentInterest(userId);

  const { data, error } = await supabase
    .from('investments')
    .select('id, code, name, fund_amount, total_earnings, current_value')
    .eq('user_id', userId)
    .eq('status', 'Active')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const principal = Number(row.fund_amount);
    const totalEarnings = Number(row.total_earnings ?? 0);
    const withdrawalAmount =
      row.current_value != null
        ? Number(row.current_value)
        : principal + totalEarnings;

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      label: `${row.code} · ${row.name}`,
      withdrawalAmount,
    };
  });
}

export async function getActiveInvestmentForUser(
  userId: string,
  investmentId: string
): Promise<ActiveInvestmentOption | null> {
  await processUserInvestmentInterest(userId);

  const { data, error } = await supabase
    .from('investments')
    .select('id, code, name, fund_amount, total_earnings, current_value, status')
    .eq('user_id', userId)
    .eq('id', investmentId)
    .eq('status', 'Active')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const principal = Number(data.fund_amount);
  const totalEarnings = Number(data.total_earnings ?? 0);
  const withdrawalAmount =
    data.current_value != null
      ? Number(data.current_value)
      : principal + totalEarnings;

  return {
    id: data.id,
    code: data.code,
    name: data.name,
    label: `${data.code} · ${data.name}`,
    withdrawalAmount,
  };
}

export async function createFundRequest(
  input: CreateFundRequestInput
): Promise<Investment> {
  const amountError = validateFundAmount(input.fundAmount);
  if (amountError) {
    throw new Error(amountError);
  }

  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: input.userId,
      fund_amount: input.fundAmount,
      bank_account_id: input.bankAccountId,
      nominee_id: input.nomineeId,
      pay_date: input.payDate,
      referral_code: input.referralCode?.trim().toUpperCase() || null,
      agreement_charges: AGREEMENT_CHARGES,
      status: 'Pending',
      name: 'New Fund Request',
      detail_subtitle: 'New Fund Request',
      current_value: input.fundAmount,
      interest_rate: 0.05,
      tds_percent: 0.1,
      total_earnings: 0,
      tds_deducted_amount: 0,
      completed_interest_periods: 0,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapInvestmentRow(data as InvestmentRow);
}

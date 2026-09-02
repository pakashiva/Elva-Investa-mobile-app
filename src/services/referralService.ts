import { supabase } from '../lib/supabase';
import {
  ReferralHistoryItem,
  ReferralStats,
} from '../types/referral';
import { formatInr } from '../utils/currency';

type ReferralStatsRow = {
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  referral_rate: number;
  tds_rate: number;
};

type ReferralHistoryRow = {
  id: string;
  referred_name: string;
  investment_code: string | null;
  capital_amount: number;
  net_bonus: number;
  referral_code: string;
  created_at: string;
};

function mapReferralStatsRow(
  referralCode: string,
  row: ReferralStatsRow
): ReferralStats {
  return {
    referralCode,
    totalReferrals: Number(row.total_referrals ?? 0),
    totalEarnings: Number(row.total_earnings ?? 0),
    pendingEarnings: Number(row.pending_earnings ?? 0),
    referralRate: Number(row.referral_rate ?? 0.01),
    tdsRate: Number(row.tds_rate ?? 0.02),
  };
}

function mapReferralHistoryRow(row: ReferralHistoryRow): ReferralHistoryItem {
  return {
    id: row.id,
    referredName: row.referred_name?.trim() || 'Referred user',
    investmentCode: row.investment_code?.trim() || '—',
    capitalAmount: Number(row.capital_amount),
    netBonus: Number(row.net_bonus),
    referralCode: row.referral_code,
    createdAt: row.created_at,
  };
}

export function normalizeReferralCodeInput(code: string): string {
  return code.trim().toUpperCase().replace(/\s/g, '');
}

export async function getMyReferralCode(): Promise<string> {
  const { data, error } = await supabase.rpc('get_my_referral_code');

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === 'string' ? data.trim() : '';
}

export async function validateReferralCode(code: string): Promise<boolean> {
  const normalized = normalizeReferralCodeInput(code);
  if (!normalized) {
    return true;
  }

  const { data, error } = await supabase.rpc('validate_referral_code', {
    p_code: normalized,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export type ReferralCodeValidationResult = {
  valid: boolean;
  errorMessage?: string;
};

export async function validateReferralCodeForSubmit(
  code: string
): Promise<ReferralCodeValidationResult> {
  const normalized = normalizeReferralCodeInput(code);
  if (!normalized) {
    return { valid: true };
  }

  const ownCode = await getMyReferralCode();
  if (ownCode && normalized === ownCode) {
    return {
      valid: false,
      errorMessage: 'You cannot use your own referral code.',
    };
  }

  const isValid = await validateReferralCode(normalized);
  if (!isValid) {
    return {
      valid: false,
      errorMessage: 'Please enter a valid referral code or leave it blank.',
    };
  }

  return { valid: true };
}

export async function getReferralStats(): Promise<ReferralStats> {
  const [codeResult, statsResult] = await Promise.all([
    supabase.rpc('get_my_referral_code'),
    supabase.rpc('get_my_referral_stats'),
  ]);

  if (codeResult.error) {
    throw new Error(codeResult.error.message);
  }

  if (statsResult.error) {
    throw new Error(statsResult.error.message);
  }

  const referralCode =
    typeof codeResult.data === 'string' ? codeResult.data.trim() : '';

  const stats = (statsResult.data ?? {}) as ReferralStatsRow;
  return mapReferralStatsRow(referralCode, stats);
}

export async function getReferralHistory(): Promise<ReferralHistoryItem[]> {
  const { data, error } = await supabase.rpc('get_my_referral_history');

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) =>
    mapReferralHistoryRow(row as ReferralHistoryRow)
  );
}

/** Alias used by referral UI screens. */
export const getReferralRewards = getReferralHistory;

export function formatReferralHistoryDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = date.getDate().toString().padStart(2, '0');
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatReferralStatsForDisplay(stats: ReferralStats) {
  const creditedUsers = stats.totalReferrals;

  return {
    totalReferralsLabel:
      stats.totalReferrals === 1
        ? '1 User'
        : `${stats.totalReferrals} Users`,
    totalReferralsFooter:
      creditedUsers === 0
        ? 'No credited referrals yet'
        : `${creditedUsers} credited referral${creditedUsers === 1 ? '' : 's'}`,
    totalEarningsLabel: formatInr(stats.totalEarnings),
    totalEarningsFooter: 'Earned directly',
    pendingLabel: formatInr(stats.pendingEarnings),
    pendingFooter:
      stats.pendingEarnings > 0 ? 'Processing' : 'No pending earnings',
  };
}

export function formatReferralHistoryForDisplay(
  items: ReferralHistoryItem[]
): { id: string; name: string; meta: string; amount: string }[] {
  return items.map((item) => ({
    id: item.id,
    name: item.referredName,
    meta: `${formatReferralHistoryDate(item.createdAt)} • Active`,
    amount: `+ ${formatInr(item.netBonus)}`,
  }));
}

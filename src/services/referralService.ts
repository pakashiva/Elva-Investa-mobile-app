import { ReferralHistoryItem, ReferralStats } from '../types/referral';
import { formatInr } from '../utils/currency';
import { apiRequest } from '../lib/api';

type ReferralApiResponse = {
  referralCode: string;
  referralRate: number;
  tdsRate: number;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  history: ReferralHistoryItem[];
};

export function normalizeReferralCodeInput(code: string): string {
  return code.trim().toUpperCase().replace(/\s/g, '');
}

export function isReferralCodeFormatValid(code: string): boolean {
  const normalized = normalizeReferralCodeInput(code);
  if (!normalized) return true;
  return /^[A-Z0-9]{8}$/.test(normalized);
}

async function fetchReferrals(): Promise<ReferralApiResponse> {
  return apiRequest<ReferralApiResponse>('/api/mobile/referrals');
}

export async function getMyReferralCode(): Promise<string> {
  const data = await fetchReferrals();
  return data.referralCode?.trim() ?? '';
}

export async function validateReferralCode(code: string): Promise<boolean> {
  const result = await validateReferralCodeForSubmit(code);
  return result.valid;
}

export type ReferralLookupResult = {
  valid: boolean;
  referrerName: string | null;
  referralCode: string | null;
};

export async function lookupReferralCode(
  code: string
): Promise<ReferralLookupResult> {
  const normalized = normalizeReferralCodeInput(code);
  if (!normalized) {
    return { valid: true, referrerName: null, referralCode: null };
  }
  const result = await validateReferralCodeForSubmit(normalized);
  return {
    valid: result.valid,
    referrerName: result.referrerName ?? null,
    referralCode: result.valid ? normalized : null,
  };
}

export type ReferralCodeValidationResult = {
  valid: boolean;
  errorMessage?: string;
  referrerName?: string | null;
};

export async function validateReferralCodeForSubmit(
  code: string
): Promise<ReferralCodeValidationResult> {
  const normalized = normalizeReferralCodeInput(code);
  if (!normalized) {
    return { valid: true };
  }

  if (!isReferralCodeFormatValid(normalized)) {
    return {
      valid: false,
      errorMessage: 'Please enter a valid referral code or leave it blank.',
    };
  }

  try {
    const data = await apiRequest<{ valid?: boolean; referrerName?: string }>(
      '/api/mobile/referrals/validate',
      {
        method: 'POST',
        body: JSON.stringify({ code: normalized }),
      }
    );
    return {
      valid: true,
      referrerName: data.referrerName?.trim() || null,
    };
  } catch (error) {
    return {
      valid: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Please enter a valid referral code or leave it blank.',
    };
  }
}

export async function getReferralStats(): Promise<ReferralStats> {
  const data = await fetchReferrals();
  return {
    referralCode: data.referralCode,
    totalReferrals: Number(data.totalReferrals ?? 0),
    totalEarnings: Number(data.totalEarnings ?? 0),
    pendingEarnings: Number(data.pendingEarnings ?? 0),
    referralRate: Number(data.referralRate ?? 0.01),
    tdsRate: Number(data.tdsRate ?? 0.02),
  };
}

export async function getReferralHistory(): Promise<ReferralHistoryItem[]> {
  const data = await fetchReferrals();
  return data.history ?? [];
}

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

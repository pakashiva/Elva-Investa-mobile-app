export type ReferralRewardStatus = 'credited';

export interface ReferralSettings {
  referralRate: number;
  tdsRate: number;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralRate: number;
  tdsRate: number;
}

export interface ReferralHistoryItem {
  id: string;
  referredName: string;
  investmentCode: string;
  capitalAmount: number;
  netBonus: number;
  referralCode: string;
  createdAt: string;
}

export interface ReferralStatsDisplay {
  totalReferralsLabel: string;
  totalReferralsFooter: string;
  totalEarningsLabel: string;
  totalEarningsFooter: string;
  pendingLabel: string;
  pendingFooter: string;
}

export interface ReferralHistoryDisplay {
  id: string;
  name: string;
  meta: string;
  amount: string;
}

export type InvestmentStatus = 'Active' | 'Pending' | 'Closed';

export type InvestmentFilter = 'All' | InvestmentStatus;

export interface Investment {
  id: string;
  code: string;
  name: string;
  /** Longer subtitle shown on Investment Details header */
  detailSubtitle: string;
  status: InvestmentStatus;
  invested: string;
  currentValue: string;
  yieldRate: string;
  earnedInterest: string;
  tdsDeducted: string;
  netEarned: string;
}

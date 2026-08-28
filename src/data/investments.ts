import { Investment, InvestmentFilter } from '../types/investment';

/** Temporary dummy data — will be replaced by backend later */
export const DUMMY_INVESTMENTS: Investment[] = [
  {
    id: '1',
    code: 'INV-000142',
    name: 'Growth Plus Fixed Tenure',
    detailSubtitle: 'Growth Plus Fixed Tenure Investment',
    status: 'Active',
    invested: '₹2,50,000',
    currentValue: '₹2,85,775',
    yieldRate: '5.0% p.a.',
    earnedInterest: '₹35,775',
    tdsDeducted: '₹3,975',
    netEarned: '₹35,775',
  },
  {
    id: '2',
    code: 'INV-000148',
    name: 'High Yield Corporate',
    detailSubtitle: 'High Yield Corporate Investment',
    status: 'Active',
    invested: '₹3,00,000',
    currentValue: '₹3,32,100',
    yieldRate: '8.2% p.a.',
    earnedInterest: '₹32,100',
    tdsDeducted: '₹3,567',
    netEarned: '₹32,100',
  },
  {
    id: '3',
    code: 'INV-000110',
    name: 'Secure Bond Fund',
    detailSubtitle: 'Secure Bond Fund Investment',
    status: 'Closed',
    invested: '₹1,50,000',
    currentValue: '₹1,58,500',
    yieldRate: '4.5% p.a.',
    earnedInterest: '₹8,500',
    tdsDeducted: '₹945',
    netEarned: '₹8,500',
  },
];

export const INVESTMENT_FILTERS: InvestmentFilter[] = [
  'All',
  'Active',
  'Pending',
  'Closed',
];

export function filterInvestments(
  items: Investment[],
  filter: InvestmentFilter
): Investment[] {
  if (filter === 'All') return items;
  return items.filter((item) => item.status === filter);
}

export function getInvestmentById(id: string): Investment | undefined {
  return DUMMY_INVESTMENTS.find((item) => item.id === id);
}

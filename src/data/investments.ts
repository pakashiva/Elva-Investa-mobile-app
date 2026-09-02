import { Investment, InvestmentFilter } from '../types/investment';

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

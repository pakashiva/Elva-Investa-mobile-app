import { DUMMY_BANK_ACCOUNTS } from './fundRequest';
import { DUMMY_INVESTMENTS } from './investments';

/** Dummy fund options for Create Withdrawal Request */
export const WITHDRAWAL_FUND_OPTIONS = DUMMY_INVESTMENTS.filter(
  (inv) => inv.status === 'Active'
).map((inv) => ({
  id: inv.id,
  label: `${inv.code} · ${inv.name}`,
}));

export const WITHDRAWAL_BANK_OPTIONS = DUMMY_BANK_ACCOUNTS.map((a) => ({
  id: a.id,
  label: a.label,
}));

/** Requested date shown on Create New Request timeline (dummy) */
export const WITHDRAWAL_REQUESTED_DATE = '26 Aug 2026';

export type WithdrawalStrategy = 'full' | 'partial';

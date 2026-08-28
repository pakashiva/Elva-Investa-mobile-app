import { WithdrawalRequest } from '../types/withdrawal';

/** Temporary dummy data — matches reference; replaced by backend later */
export const DUMMY_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'w1',
    investmentCode: 'INV-000142',
    fundName: 'Growth Plus',
    status: 'Paid',
    requestedAmount: '₹1,00,000',
    netPayout: '₹1,00,000',
    requestedOn: '12 Jan 2026',
    statusDateLabel: 'Paid on',
    statusDate: '14 Jan 2026',
  },
  {
    id: 'w2',
    investmentCode: 'INV-000148',
    fundName: 'Alpha Yield',
    status: 'Approved',
    requestedAmount: '₹50,000',
    netPayout: '₹49,950',
    requestedOn: '08 Feb 2026',
    statusDateLabel: 'Approved on',
    statusDate: '08 Feb 2026',
  },
  {
    id: 'w3',
    investmentCode: 'INV-000110',
    fundName: 'Secure Shield',
    status: 'Processing',
    requestedAmount: '₹75,000',
    netPayout: '₹74,950',
    requestedOn: '22 Feb 2026',
    statusDateLabel: 'Status updated',
    statusDate: '22 Feb 2026',
  },
  {
    id: 'w4',
    investmentCode: 'INV-000201',
    fundName: 'Flexi Cash Flow',
    status: 'Rejected',
    requestedAmount: '₹2,00,000',
    netPayout: '—',
    requestedOn: '05 Mar 2026',
    statusDateLabel: 'Rejected on',
    statusDate: '05 Mar 2026',
  },
];

export function getWithdrawalById(id: string): WithdrawalRequest | undefined {
  return DUMMY_WITHDRAWALS.find((item) => item.id === id);
}

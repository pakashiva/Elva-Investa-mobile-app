export type WithdrawalStatus = 'Paid' | 'Approved' | 'Processing' | 'Rejected';

export interface WithdrawalRequest {
  id: string;
  investmentCode: string;
  fundName: string;
  status: WithdrawalStatus;
  requestedAmount: string;
  netPayout: string;
  requestedOn: string;
  statusDateLabel: string;
  statusDate: string;
}

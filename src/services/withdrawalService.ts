import { WithdrawalRequest, WithdrawalStatus } from '../types/withdrawal';
import { formatInr } from '../utils/currency';
import { apiRequest } from '../lib/api';

export type WithdrawalRow = {
  id: string;
  requestId?: string | null;
  investmentId: string;
  investmentCode: string;
  requestCode?: string;
  fundName: string;
  status: string;
  strategy: 'full' | 'partial';
  withdrawalAmount: number;
  netPayout: number;
  requestedOn: string;
  statusDate: string;
  createdAt: string;
};

export type CreateWithdrawalInput = {
  userId: string;
  investmentId: string;
  bankAccountId: string;
  withdrawalAmount: number;
  strategy: 'full' | 'partial';
};

const STATUS_DATE_LABEL: Record<WithdrawalStatus, string> = {
  Processing: 'Status updated',
  Approved: 'Approved on',
  Paid: 'Paid on',
  Rejected: 'Rejected on',
};

function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${String(isoDate).slice(0, 10)}T00:00:00`);
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
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = date.getDate().toString().padStart(2, '0');
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function mapStatus(status: string): WithdrawalStatus {
  if (status === 'Approved' || status === 'Paid' || status === 'Rejected') {
    return status;
  }
  return 'Processing';
}

function mapApiWithdrawal(row: WithdrawalRow): WithdrawalRequest {
  const status = mapStatus(row.status);
  const requestCode = row.requestCode || row.requestId || row.id.slice(0, 8).toUpperCase();
  return {
    id: row.id,
    investmentCode: `${requestCode} · ${row.investmentCode}`,
    fundName: row.fundName,
    status,
    requestedAmount: formatInr(row.withdrawalAmount),
    netPayout: formatInr(row.netPayout),
    requestedOn: formatDisplayDate(String(row.requestedOn ?? '')),
    statusDateLabel: STATUS_DATE_LABEL[status],
    statusDate: formatDisplayDate(String(row.statusDate ?? '')),
  };
}

export async function getUserWithdrawals(
  _userId?: string
): Promise<WithdrawalRequest[]> {
  const data = await apiRequest<{ withdrawals: WithdrawalRow[] }>(
    '/api/mobile/withdrawals'
  );
  return (data.withdrawals ?? []).map(mapApiWithdrawal);
}

export async function getWithdrawalByIdForUser(
  _userId: string,
  withdrawalId: string
): Promise<WithdrawalRequest | null> {
  try {
    const data = await apiRequest<{ withdrawal: WithdrawalRow }>(
      `/api/mobile/withdrawals/${withdrawalId}`
    );
    return data.withdrawal ? mapApiWithdrawal(data.withdrawal) : null;
  } catch {
    return null;
  }
}

export async function createWithdrawalRequest(
  input: CreateWithdrawalInput
): Promise<WithdrawalRequest> {
  const data = await apiRequest<{ withdrawal: WithdrawalRow }>(
    '/api/mobile/withdrawals',
    {
      method: 'POST',
      body: JSON.stringify({
        investmentId: input.investmentId,
        bankAccountId: input.bankAccountId,
        withdrawalAmount: input.withdrawalAmount,
        strategy: input.strategy,
      }),
    }
  );
  return mapApiWithdrawal(data.withdrawal);
}

export async function cancelWithdrawalRequest(
  _userId: string,
  withdrawalId: string
): Promise<void> {
  await apiRequest(`/api/mobile/withdrawals/${withdrawalId}`, {
    method: 'DELETE',
  });
}

export function getRequestedDateLabel(): string {
  return formatDisplayDate(new Date().toISOString().slice(0, 10));
}

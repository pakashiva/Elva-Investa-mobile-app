import { supabase } from '../lib/supabase';
import { WithdrawalRequest, WithdrawalStatus } from '../types/withdrawal';
import { formatInr } from '../utils/currency';

export type WithdrawalRow = {
  id: string;
  user_id: string;
  investment_id: string;
  bank_account_id: string;
  status: WithdrawalStatus;
  withdrawal_amount: number;
  strategy: 'full' | 'partial';
  code?: string | null;
  request_id?: string | null;
  requested_on: string;
  net_payout: number | null;
  status_date: string;
  created_at: string;
  updated_at: string;
  investments?: {
    code: string;
    name: string;
  } | null;
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
  const date = new Date(`${isoDate}T00:00:00`);
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

function formatStatusDate(isoDateTime: string): string {
  const date = new Date(isoDateTime);
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

/** Net payout equals requested amount — no charge deducted on withdrawal. */
function calculateNetPayout(withdrawalAmount: number): number {
  return Math.max(withdrawalAmount, 0);
}

function mapWithdrawalRow(row: WithdrawalRow): WithdrawalRequest {
  const investmentCode = row.investments?.code ?? '—';
  const fundName = row.investments?.name ?? 'Investment';
  const amount = Number(row.withdrawal_amount);
  const netPayoutValue =
    row.net_payout != null
      ? Number(row.net_payout)
      : calculateNetPayout(amount);
  const requestCode =
    row.request_id?.trim() ||
    row.code?.trim() ||
    row.id.slice(0, 8).toUpperCase();

  return {
    id: row.id,
    investmentCode: `${requestCode} · ${investmentCode}`,
    fundName,
    status: row.status,
    requestedAmount: formatInr(amount),
    netPayout: formatInr(netPayoutValue),
    requestedOn: formatDisplayDate(row.requested_on),
    statusDateLabel: STATUS_DATE_LABEL[row.status],
    statusDate: formatStatusDate(row.status_date),
  };
}

export async function getUserWithdrawals(
  userId: string
): Promise<WithdrawalRequest[]> {
  const { data, error } = await supabase
    .from('withdrawals')
    .select(
      `
      *,
      investments (
        code,
        name
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapWithdrawalRow(row as WithdrawalRow));
}

export async function getWithdrawalByIdForUser(
  userId: string,
  withdrawalId: string
): Promise<WithdrawalRequest | null> {
  const { data, error } = await supabase
    .from('withdrawals')
    .select(
      `
      *,
      investments (
        code,
        name
      )
    `
    )
    .eq('user_id', userId)
    .eq('id', withdrawalId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapWithdrawalRow(data as WithdrawalRow);
}

export async function createWithdrawalRequest(
  input: CreateWithdrawalInput
): Promise<WithdrawalRequest> {
  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      user_id: input.userId,
      investment_id: input.investmentId,
      bank_account_id: input.bankAccountId,
      withdrawal_amount: input.withdrawalAmount,
      net_payout: calculateNetPayout(input.withdrawalAmount),
      strategy: input.strategy,
      status: 'Processing',
    })
    .select(
      `
      *,
      investments (
        code,
        name
      )
    `
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapWithdrawalRow(data as WithdrawalRow);
}

/**
 * Cancels a Processing withdrawal by deleting it.
 * Only Processing requests owned by the user can be removed.
 */
export async function cancelWithdrawalRequest(
  userId: string,
  withdrawalId: string
): Promise<void> {
  if (!userId || !withdrawalId) {
    throw new Error('Missing withdrawal details.');
  }

  const { data, error } = await supabase
    .from('withdrawals')
    .delete()
    .eq('id', withdrawalId)
    .eq('user_id', userId)
    .eq('status', 'Processing')
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'This request can no longer be cancelled. It may already be approved or removed.'
    );
  }
}

export function getRequestedDateLabel(): string {
  return formatDisplayDate(new Date().toISOString().slice(0, 10));
}

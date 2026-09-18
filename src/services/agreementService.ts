import { supabase } from '../lib/supabase';
import { formatInr } from '../utils/currency';
import { amountToIndianWords } from '../utils/amountInWords';
import { isMissingTableError } from '../utils/supabaseErrors';
import {
  AgreementListItem,
  AgreementRenewalMode,
  CreateRenewalRequestInput,
} from '../types/agreement';

const AGREEMENT_DAYS = 365;

type InvestmentRow = {
  id: string;
  code: string | null;
  request_id: string | null;
  fund_amount: number | string;
  invested_date: string | null;
  created_at: string;
  status: string;
};

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateLabelFromDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function daysUntil(endDate: Date, today = new Date()): number {
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  const diffMs = end.getTime() - startOfToday.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/** Prefer numeric part of INV-0001980 → 1980; else request_id; else short id. */
function resolveAgreementId(row: InvestmentRow): string {
  const code = row.code?.trim() ?? '';
  const fromCode = code.match(/(\d+)\s*$/);
  if (fromCode?.[1]) {
    return String(Number(fromCode[1]));
  }
  if (row.request_id?.trim()) {
    return row.request_id.trim();
  }
  return row.id.slice(0, 8).toUpperCase();
}

function mapInvestmentToAgreement(
  row: InvestmentRow,
  customerId: string
): AgreementListItem {
  const fundAmount = Number(row.fund_amount) || 0;
  const startSource = row.invested_date || row.created_at;
  const startDate = parseDateOnly(startSource);
  const endDate = addDays(startDate, AGREEMENT_DAYS);
  const days = daysUntil(endDate);
  const isExpired = days < 0;
  const isActive = !isExpired;
  const showRenewalUpcoming = isActive && days <= 15;

  return {
    id: row.id,
    agreementId: resolveAgreementId(row),
    customerId: customerId || 'CUST—',
    fundAmount,
    fundAmountLabel: formatInr(fundAmount),
    fundAmountWords: amountToIndianWords(fundAmount),
    startDateLabel: formatDateLabelFromDate(startDate),
    endDateLabel: formatDateLabelFromDate(endDate),
    daysUntilEnd: days,
    isActive,
    isExpired,
    showRenewalUpcoming,
    renewalInLabel: isExpired
      ? 'Expired'
      : days === 0
        ? 'Today'
        : `${days} Day${days === 1 ? '' : 's'}`,
  };
}

export async function getUserAgreements(
  userId: string
): Promise<AgreementListItem[]> {
  const [investmentsResult, customerResult] = await Promise.all([
    supabase
      .from('investments')
      .select(
        'id, code, request_id, fund_amount, invested_date, created_at, status'
      )
      .eq('user_id', userId)
      .eq('status', 'Active')
      .order('invested_date', { ascending: false }),
    supabase
      .from('customers')
      .select('customer_id')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (investmentsResult.error) {
    throw new Error(investmentsResult.error.message);
  }

  const customerId =
    !customerResult.error && customerResult.data?.customer_id
      ? String(customerResult.data.customer_id).trim()
      : '';

  return (investmentsResult.data ?? []).map((row) =>
    mapInvestmentToAgreement(row as InvestmentRow, customerId)
  );
}

export async function submitAgreementRenewalRequest(
  userId: string,
  input: CreateRenewalRequestInput
): Promise<void> {
  const { data: investment, error: investmentError } = await supabase
    .from('investments')
    .select(
      'id, code, request_id, fund_amount, invested_date, created_at, status, user_id'
    )
    .eq('id', input.investmentId)
    .eq('user_id', userId)
    .eq('status', 'Active')
    .maybeSingle();

  if (investmentError) {
    throw new Error(investmentError.message);
  }
  if (!investment) {
    throw new Error('Agreement not found for this investment.');
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  const customerId = customer?.customer_id?.trim();
  if (!customerId) {
    throw new Error('Customer ID not found for this account.');
  }

  const agreement = mapInvestmentToAgreement(
    investment as InvestmentRow,
    customerId
  );

  const { data: existingPending, error: pendingError } = await supabase
    .from('agreement_renewal_requests')
    .select('id')
    .eq('investment_id', input.investmentId)
    .eq('status', 'Pending')
    .maybeSingle();

  if (pendingError && !isMissingTableError(pendingError)) {
    throw new Error(pendingError.message);
  }
  if (existingPending) {
    throw new Error(
      'A renewal request is already pending for this agreement.'
    );
  }

  const mode: AgreementRenewalMode = input.mode;
  const incrementAmount =
    mode === 'increase' ? Number(input.incrementAmount ?? 0) : null;

  if (mode === 'increase') {
    if (!incrementAmount || !Number.isFinite(incrementAmount) || incrementAmount <= 0) {
      throw new Error('Enter a valid amount to add to your principal.');
    }
  } else if (!agreement.showRenewalUpcoming) {
    // Same-amount renewal only; increase investment is allowed anytime
    throw new Error(
      'Renew with same amount is only available when your agreement expires in 15 days or less.'
    );
  }

  const { error } = await supabase.from('agreement_renewal_requests').insert({
    investment_id: investment.id,
    user_id: userId,
    agreement_id: agreement.agreementId,
    customer_id: customerId,
    current_amount: agreement.fundAmount,
    increment_amount: incrementAmount,
    mode,
    status: 'Pending',
  });

  if (error) {
    throw new Error(error.message);
  }
}

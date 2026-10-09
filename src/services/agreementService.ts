import { formatInr } from '../utils/currency';
import { amountToIndianWords } from '../utils/amountInWords';
import {
  AgreementListItem,
  CreateRenewalRequestInput,
} from '../types/agreement';
import { apiRequest } from '../lib/api';

type AgreementApiRow = {
  id: string;
  agreementId: string;
  customerId: string;
  fundAmount: number;
  startDate: string;
  endDate: string;
  startDateLabel: string;
  endDateLabel: string;
  daysUntilEnd: number;
  isActive: boolean;
  isExpired: boolean;
  showRenewalUpcoming: boolean;
  renewalInLabel: string;
};

function mapAgreement(row: AgreementApiRow): AgreementListItem {
  return {
    id: row.id,
    agreementId: row.agreementId,
    customerId: row.customerId || 'CUST—',
    fundAmount: row.fundAmount,
    fundAmountLabel: formatInr(row.fundAmount),
    fundAmountWords: amountToIndianWords(row.fundAmount),
    startDateLabel: row.startDateLabel,
    endDateLabel: row.endDateLabel,
    daysUntilEnd: row.daysUntilEnd,
    isActive: row.isActive,
    isExpired: row.isExpired,
    showRenewalUpcoming: row.showRenewalUpcoming,
    renewalInLabel: row.renewalInLabel,
  };
}

export async function getUserAgreements(
  _userId?: string
): Promise<AgreementListItem[]> {
  const data = await apiRequest<{ agreements: AgreementApiRow[] }>(
    '/api/mobile/agreements'
  );
  return (data.agreements ?? []).map(mapAgreement);
}

export async function submitAgreementRenewalRequest(
  _userId: string,
  input: CreateRenewalRequestInput
): Promise<void> {
  await apiRequest(`/api/mobile/agreements/${input.investmentId}/renewal`, {
    method: 'POST',
    body: JSON.stringify({
      mode: input.mode,
      incrementAmount: input.incrementAmount ?? null,
    }),
  });
}

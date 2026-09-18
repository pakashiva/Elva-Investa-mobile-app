export type AgreementFilter = 'active' | 'expired' | 'all';

export type AgreementRenewalMode = 'same_amount' | 'increase';

export type AgreementListItem = {
  /** Investment UUID (agreement is derived from approved investment). */
  id: string;
  /** Display agreement id shown in UI / stored on renewal request. */
  agreementId: string;
  customerId: string;
  fundAmount: number;
  fundAmountLabel: string;
  fundAmountWords: string;
  startDateLabel: string;
  endDateLabel: string;
  daysUntilEnd: number;
  isActive: boolean;
  isExpired: boolean;
  showRenewalUpcoming: boolean;
  renewalInLabel: string;
};

export type CreateRenewalRequestInput = {
  investmentId: string;
  mode: AgreementRenewalMode;
  /** Amount to add to principal when mode is increase; otherwise null. */
  incrementAmount?: number | null;
};

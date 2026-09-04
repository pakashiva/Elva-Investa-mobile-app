export type BankAccount = {
  id: string;
  label: string;
};

export type Nominee = {
  id: string;
  name: string;
};

export type NewFundRequestFormValues = {
  title: string;
  fundAmount: string;
  paydate: string;
  bankAccountId: string | null;
  nomineeId: string | null;
  hasReferralCode: boolean;
  referralCode: string;
  agreedToTerms: boolean;
};

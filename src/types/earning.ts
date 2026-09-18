export type MonthlyEarning = {
  id: string;
  investmentId: string;
  investmentName: string;
  investmentCode: string;
  periodIndex: number;
  /** Human label e.g. "Mar 2026" */
  monthLabel: string;
  /** Period end date label e.g. "15/3/2026" */
  periodEndLabel: string;
  principal: number;
  principalLabel: string;
  interestRatePercent: number;
  /** Gross interest for the period (before TDS). */
  interestEarned: number;
  interestEarnedLabel: string;
  tdsDeducted: number;
  tdsDeductedLabel: string;
  /** Net credited after TDS (= period contribution to total_earnings). */
  netPayout: number;
  netPayoutLabel: string;
  bankName: string;
  bankMaskedNumber: string;
  bankIfsc: string;
  bankAccountType: string;
};

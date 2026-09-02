export const PARTIAL_WITHDRAWAL_MIN_REMAINING = 100000;

export function validatePartialWithdrawalAmount(
  principal: number,
  withdrawalAmount: number
): string | null {
  if (!withdrawalAmount || withdrawalAmount <= 0) {
    return 'Enter a withdrawal amount greater than zero.';
  }

  if (withdrawalAmount >= principal) {
    return 'For withdrawing the full principal, use Full Withdrawal instead.';
  }

  const remaining = principal - withdrawalAmount;
  if (remaining < PARTIAL_WITHDRAWAL_MIN_REMAINING) {
    return `Minimum remaining balance is ₹${PARTIAL_WITHDRAWAL_MIN_REMAINING.toLocaleString('en-IN')}.`;
  }

  return null;
}

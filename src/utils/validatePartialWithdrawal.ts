export function validatePartialWithdrawalAmount(
  principal: number,
  withdrawalAmount: number,
  openPartialAmount = 0
): string | null {
  if (!withdrawalAmount || withdrawalAmount <= 0) {
    return 'Enter a withdrawal amount greater than zero.';
  }

  const availablePrincipal = Math.max(0, principal - openPartialAmount);

  if (withdrawalAmount > availablePrincipal) {
    return `You can withdraw at most ₹${availablePrincipal.toLocaleString('en-IN')} from this fund right now.`;
  }

  if (withdrawalAmount >= principal) {
    return 'For withdrawing the full principal, use Full Withdrawal instead.';
  }

  return null;
}

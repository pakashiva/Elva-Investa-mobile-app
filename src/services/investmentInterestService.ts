export async function processUserInvestmentInterest(
  _userId?: string
): Promise<void> {
  // Interest is accrued in Postgres, not from the mobile app.
}

export function resetInvestmentInterestProcessing(): void {
  // No-op — kept for Auth session changes.
}

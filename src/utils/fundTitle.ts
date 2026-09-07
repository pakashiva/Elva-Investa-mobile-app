/** Suggests "Investment N" skipping names already used (case-insensitive). */
export function suggestNextInvestmentTitle(existingNames: string[]): string {
  const used = new Set(
    existingNames.map((name) => name.trim().toLowerCase()).filter(Boolean)
  );

  let n = 1;
  while (used.has(`investment ${n}`)) {
    n += 1;
  }
  return `Investment ${n}`;
}

export function isInvestmentTitleTaken(
  title: string,
  existingNames: string[]
): boolean {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return false;
  return existingNames.some((name) => name.trim().toLowerCase() === normalized);
}

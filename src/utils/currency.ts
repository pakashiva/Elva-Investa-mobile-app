export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export function parseInrInput(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) {
    return 0;
  }
  return Number(cleaned);
}

export function formatInrPlain(amount: number): string {
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

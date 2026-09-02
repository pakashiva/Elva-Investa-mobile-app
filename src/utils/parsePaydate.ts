const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Converts display paydate "DD Mon YYYY" to ISO date "YYYY-MM-DD" */
export function parseDisplayPaydate(display: string): string {
  const parts = display.trim().split(/\s+/);
  if (parts.length !== 3) {
    throw new Error('Invalid pay date format');
  }
  const [dayStr, monthStr, yearStr] = parts;
  const month = MONTHS[monthStr];
  if (month === undefined) {
    throw new Error('Invalid pay date month');
  }
  const day = dayStr.padStart(2, '0');
  const monthNum = String(month + 1).padStart(2, '0');
  return `${yearStr}-${monthNum}-${day}`;
}

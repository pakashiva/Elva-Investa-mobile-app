export function formatDateOfBirth(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseDateOfBirth(value: string): Date {
  const [day, month, year] = value.split('/').map((part) => Number(part));
  if (day && month && year) {
    return new Date(year, month - 1, day);
  }
  return new Date(1992, 7, 15);
}

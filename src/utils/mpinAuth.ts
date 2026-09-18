/** Maps UI 4-digit MPIN to Auth password (Supabase often requires length >= 6). */
export function mpinToAuthPassword(mpin: string): string {
  return `vt1-${mpin.trim()}`;
}

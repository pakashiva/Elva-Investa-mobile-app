const IFSC_BANK_MAP: Record<string, string> = {
  HDFC: 'HDFC Bank Limited (Auto Detected)',
  ICIC: 'ICICI Bank Limited (Auto Detected)',
  SBIN: 'State Bank of India (Auto Detected)',
  UTIB: 'Axis Bank Limited (Auto Detected)',
  KKBK: 'Kotak Mahindra Bank Limited (Auto Detected)',
};

export function detectBankNameFromIfsc(ifscCode: string): string {
  const prefix = ifscCode.trim().toUpperCase().slice(0, 4);
  return IFSC_BANK_MAP[prefix] ?? '';
}

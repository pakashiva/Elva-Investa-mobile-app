export type KycDocumentType = 'aadhaar_front' | 'aadhaar_back' | 'pan_card';

export function buildKycStoragePath(
  userId: string,
  documentType: KycDocumentType,
  fileName: string
): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${userId}/${documentType}.${extension}`;
}

export async function uploadKycDocument(
  userId: string,
  documentType: KycDocumentType,
  _localUri: string,
  fileName: string
): Promise<string> {
  return buildKycStoragePath(userId, documentType, fileName);
}

export async function removeKycDocuments(_paths: string[]): Promise<void> {
  return;
}

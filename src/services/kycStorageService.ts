import { supabase } from '../lib/supabase';

export type KycDocumentType = 'aadhaar_front' | 'aadhaar_back' | 'pan_card';

const BUCKET = 'kyc-documents';

function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'jpg';
}

function getMimeType(extension: string): string {
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

export function buildKycStoragePath(
  userId: string,
  documentType: KycDocumentType,
  fileName: string
): string {
  const extension = getExtension(fileName);
  return `${userId}/${documentType}.${extension}`;
}

export async function uploadKycDocument(
  userId: string,
  documentType: KycDocumentType,
  localUri: string,
  fileName: string
): Promise<string> {
  const path = buildKycStoragePath(userId, documentType, fileName);
  const extension = getExtension(fileName);

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: getMimeType(extension),
    upsert: true,
  });

  if (error) {
    if (error.message.toLowerCase().includes('bucket not found')) {
      throw new Error(
        'KYC document storage is not set up yet. In Supabase Dashboard, run supabase/migrations/002_kyc_storage_bucket.sql in the SQL Editor, or create a private bucket named "kyc-documents" under Storage.'
      );
    }
    throw new Error(`Failed to upload ${documentType}: ${error.message}`);
  }

  return path;
}

export async function removeKycDocuments(paths: string[]): Promise<void> {
  if (!paths.length) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    throw new Error(`Failed to clean up uploaded documents: ${error.message}`);
  }
}

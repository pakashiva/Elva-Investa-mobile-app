import { RELATIONSHIP_OPTIONS } from '../data/registrationForm';
import { Nominee } from '../types/fundRequest';
import { NomineeListItem } from '../types/nominee';
import { apiRequest } from '../lib/api';

type NomineeApiRow = {
  id: string;
  nomineeName?: string;
  name?: string;
  relationship?: string;
  nomineeAadhaar?: string;
};

function maskAadhaar(aadhaar: string): string {
  const digits = aadhaar.replace(/\D/g, '');
  const last4 = digits.slice(-4) || '****';
  return `XXXX XXXX ${last4}`;
}

function relationshipLabel(relationshipId: string): string {
  const match = RELATIONSHIP_OPTIONS.find((option) => option.id === relationshipId);
  if (match) {
    return match.label;
  }
  const trimmed = relationshipId.trim();
  if (!trimmed) {
    return 'Other';
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function mapNominee(row: NomineeApiRow): NomineeListItem {
  const name = (row.nomineeName ?? row.name ?? '').trim();
  return {
    id: row.id,
    name,
    initial: (name.charAt(0) || 'N').toUpperCase(),
    relationshipId: row.relationship ?? '',
    relationshipLabel: relationshipLabel(row.relationship ?? ''),
    maskedAadhaar: maskAadhaar(row.nomineeAadhaar ?? ''),
  };
}

export async function getUserNomineesList(
  _userId?: string
): Promise<NomineeListItem[]> {
  const data = await apiRequest<{ nominees: NomineeApiRow[] }>(
    '/api/mobile/nominees'
  );
  return (data.nominees ?? []).map(mapNominee);
}

export async function getUserNominees(_userId?: string): Promise<Nominee[]> {
  const nominees = await getUserNomineesList();
  return nominees.map((row) => ({
    id: row.id,
    name: row.name,
  }));
}

export type CreateNomineeInput = {
  nomineeName: string;
  relationship: string;
  nomineeAadhaar: string;
};

export async function createNominee(
  _userId: string,
  input: CreateNomineeInput
): Promise<void> {
  await apiRequest('/api/mobile/nominees', {
    method: 'POST',
    body: JSON.stringify({
      nomineeName: input.nomineeName.trim(),
      relationship: input.relationship.trim(),
      nomineeAadhaar: input.nomineeAadhaar.replace(/\D/g, ''),
    }),
  });
}

export async function verifyNomineeOwnership(
  userId: string,
  nomineeId: string
): Promise<boolean> {
  const nominees = await getUserNominees(userId);
  return nominees.some((nominee) => nominee.id === nomineeId);
}

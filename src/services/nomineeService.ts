import { supabase } from '../lib/supabase';
import { RELATIONSHIP_OPTIONS } from '../data/registrationForm';
import { Nominee } from '../types/fundRequest';
import { NomineeListItem } from '../types/nominee';
import { isMissingTableError } from '../utils/supabaseErrors';

type NomineeRow = {
  id: string;
  nominee_name: string;
  relationship: string;
  nominee_aadhaar: string;
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

function mapNomineeRow(row: NomineeRow): NomineeListItem {
  const name = row.nominee_name.trim();
  return {
    id: row.id,
    name,
    initial: (name.charAt(0) || 'N').toUpperCase(),
    relationshipId: row.relationship,
    relationshipLabel: relationshipLabel(row.relationship),
    maskedAadhaar: maskAadhaar(row.nominee_aadhaar),
  };
}

/** Full list for Nominees screen cards */
export async function getUserNomineesList(
  userId: string
): Promise<NomineeListItem[]> {
  const { data, error } = await supabase
    .from('nominees')
    .select('id, nominee_name, relationship, nominee_aadhaar')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapNomineeRow(row as NomineeRow));
}

/** Minimal shape for fund request dropdowns */
export async function getUserNominees(userId: string): Promise<Nominee[]> {
  const { data, error } = await supabase
    .from('nominees')
    .select('id, nominee_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.nominee_name,
  }));
}

export type CreateNomineeInput = {
  nomineeName: string;
  relationship: string;
  nomineeAadhaar: string;
};

export async function createNominee(
  userId: string,
  input: CreateNomineeInput
): Promise<void> {
  const { error } = await supabase.from('nominees').insert({
    user_id: userId,
    nominee_name: input.nomineeName.trim(),
    relationship: input.relationship.trim(),
    nominee_aadhaar: input.nomineeAadhaar.replace(/\D/g, ''),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyNomineeOwnership(
  userId: string,
  nomineeId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('nominees')
    .select('id')
    .eq('user_id', userId)
    .eq('id', nomineeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

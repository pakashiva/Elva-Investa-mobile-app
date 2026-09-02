import { supabase } from '../lib/supabase';
import { Nominee } from '../types/fundRequest';

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

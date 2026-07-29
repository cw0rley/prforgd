import { supabase } from '../lib/supabase';

export interface Profile {
  username: string;
  sex: 'M' | 'F' | null;
  birthYear: number | null;
}

// Username rule: 3–20 chars, letters/numbers/underscores. Kept in sync with the
// friendly error message below.
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// Fetch the signed-in user's profile, or null if they haven't set one yet.
// NOTE: use getSession() (local read) not getUser() (network) — getUser holds
// the supabase auth lock while it round-trips, which can block every other
// getSession() call (namespace resolution, the landing gate) for ~30s if the
// network stalls.
export async function getProfile(): Promise<Profile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('username, sex, birth_year')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return { username: data.username, sex: data.sex, birthYear: data.birth_year };
}

export type SaveProfileResult = { ok: true } | { ok: false; error: string };

// Create or update the signed-in user's profile. Username uniqueness is enforced
// by the DB (unique index on lower(username)); a collision surfaces as a friendly
// message rather than a raw Postgres error.
export async function saveProfile(p: Profile): Promise<SaveProfileResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { ok: false, error: 'You must be signed in to set a profile.' };

  const username = p.username.trim();
  if (!USERNAME_RE.test(username)) {
    return { ok: false, error: 'Username must be 3–20 letters, numbers, or underscores.' };
  }
  if (p.birthYear !== null && (p.birthYear < 1900 || p.birthYear > 2100)) {
    return { ok: false, error: 'Enter a valid birth year.' };
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      username,
      sex: p.sex,
      birth_year: p.birthYear,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    // 23505 = unique_violation → username already taken by someone else.
    if ((error as any).code === '23505') {
      return { ok: false, error: 'That username is already taken.' };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

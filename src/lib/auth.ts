import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

// The web app handles the auth-callback URL (sets the session from the hash),
// so always confirm there. A native signup has no reliable redirect back into
// the app, which made confirmation links flaky; landing on the web is robust,
// and the user then signs into the app once confirmed.
const WEB_CONFIRM_URL = 'https://www.prforgd.com';

export async function signUp(email: string, password: string) {
  const emailRedirectTo =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : WEB_CONFIRM_URL;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Permanently deletes the user's account and all synced data via the
// server-side endpoint (requires service-role key, so it can't run here).
export async function deleteAccount() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');

  const res = await fetch('https://www.prforgd.com/api/delete-account', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as any));
    throw new Error(body.error || 'Account deletion failed. Please try again.');
  }

  // Server already deleted the user — just clear the local session.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function onAuthChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

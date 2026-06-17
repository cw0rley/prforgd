import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

// Email confirmation uses a 6-digit OTP code (not a magic link). The user types
// the code straight into the app, so there's no redirect back into native and
// no one-time-link that email security scanners can pre-consume — which is what
// made the old link flow flaky on phones. Requires the Supabase "Confirm
// signup" email template to include the {{ .Token }} code (see
// docs/email-otp.md).
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

// Verify the 6-digit signup confirmation code. On success Supabase returns a
// session and the user is signed in.
export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'signup',
  });
  if (error) throw error;
  return data;
}

// Re-send the signup confirmation code (e.g. if it expired or never arrived).
export async function resendSignupOtp(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
  if (error) throw error;
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

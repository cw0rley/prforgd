import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResults } from '../storage/workoutStorage';
import { readJSON, writeJSON } from './localStore';

const GRANDFATHERED_KEY = 'prforgd_grandfathered';
const FREE_LIMIT = 10;

// Base key for the locally-cached coupon bonus (extra free workouts the user
// has redeemed). Namespaced per-user via localStore so it can't leak across
// accounts on a shared device. Kept in sync from the cloud on login / redeem so
// the free-limit checks below work offline.
const COUPON_BONUS_KEY = 'coupon_bonus';

// Email domains granted unlimited access (internal / org accounts).
const UNLIMITED_EMAIL_DOMAINS = ['claytonrugby.com'];

/** True when the email belongs to a domain granted unlimited access. */
export function isUnlimitedEmail(email?: string | null): boolean {
  if (!email) return false;
  const domain = email.trim().toLowerCase().split('@')[1];
  return !!domain && UNLIMITED_EMAIL_DOMAINS.includes(domain);
}

/** Email of the currently signed-in user, if any. */
async function getCurrentEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.email ?? null;
}

export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'grandfathered' | 'free';

export interface Subscription {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

// Check if user can save a workout
export async function canSaveWorkout(userId: string | null): Promise<{ allowed: boolean; reason?: string; workoutsUsed: number }> {
  const results = await getResults();
  const count = results.length;

  // Free allowance = base free tier + any extra workouts from redeemed coupons.
  const limit = FREE_LIMIT + (await getCouponBonus());

  // Internal / org accounts (e.g. claytonrugby.com) get unlimited access.
  if (isUnlimitedEmail(await getCurrentEmail())) {
    return { allowed: true, workoutsUsed: count };
  }

  // No account — check local count only
  if (!userId) {
    if (count < limit) {
      return { allowed: true, workoutsUsed: count };
    }
    return { allowed: false, reason: 'account_required', workoutsUsed: count };
  }

  // Check if grandfathered
  const grandfathered = await isGrandfathered(userId);
  if (grandfathered) {
    return { allowed: true, workoutsUsed: count };
  }

  // Check active subscription
  const sub = await getSubscription(userId);
  if (sub.status === 'active') {
    return { allowed: true, workoutsUsed: count };
  }

  // Free tier (plus any redeemed coupon workouts)
  if (count < limit) {
    return { allowed: true, workoutsUsed: count };
  }

  return { allowed: false, reason: 'subscription_required', workoutsUsed: count };
}

// Get subscription from Supabase
export async function getSubscription(userId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { plan: null, status: 'free', currentPeriodEnd: null };
  }

  // Check if expired
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
    return { plan: data.plan, status: 'expired', currentPeriodEnd: data.current_period_end };
  }

  return {
    plan: data.plan,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
  };
}

// Check and set grandfathered status for existing users with >10 workouts
export async function isGrandfathered(userId: string): Promise<boolean> {
  // Check local cache first
  const cached = await AsyncStorage.getItem(GRANDFATHERED_KEY);
  if (cached === 'true') return true;
  if (cached === 'false') return false;

  // Check Supabase
  const { data } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'grandfathered')
    .single();

  if (data) {
    await AsyncStorage.setItem(GRANDFATHERED_KEY, 'true');
    return true;
  }

  // First time checking — if they have >10 workouts, grandfather them
  const results = await getResults();
  if (results.length > 10) {
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      status: 'grandfathered',
      plan: null,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    await AsyncStorage.setItem(GRANDFATHERED_KEY, 'true');
    return true;
  }

  await AsyncStorage.setItem(GRANDFATHERED_KEY, 'false');
  return false;
}

// Get remaining free workouts
export async function getFreeRemaining(): Promise<number> {
  // Unlimited-access accounts never see the free-workout counter.
  if (isUnlimitedEmail(await getCurrentEmail())) return Number.MAX_SAFE_INTEGER;
  const results = await getResults();
  const limit = FREE_LIMIT + (await getCouponBonus());
  return Math.max(0, limit - results.length);
}

// ---------------------------------------------------------------------------
// Coupons — redeemed codes grant extra free workouts (see scripts/coupons.sql).
// ---------------------------------------------------------------------------

/** Locally-cached number of extra free workouts from redeemed coupons. */
export async function getCouponBonus(): Promise<number> {
  const n = await readJSON<number>(COUPON_BONUS_KEY, 0);
  return typeof n === 'number' && n > 0 ? n : 0;
}

/**
 * Pull the user's total redeemed coupon workouts from the cloud and cache it
 * locally (so the free-limit checks work offline). No-op when logged out.
 * Returns the bonus total.
 */
export async function refreshCouponBonus(): Promise<number> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return getCouponBonus();

  const { data, error } = await supabase
    .from('coupon_redemptions')
    .select('workouts');
  if (error || !data) return getCouponBonus();

  const total = data.reduce((sum, r: { workouts: number }) => sum + (r.workouts || 0), 0);
  await writeJSON(COUPON_BONUS_KEY, total);
  return total;
}

export type RedeemResult =
  | { ok: true; workouts: number; total: number }
  | { ok: false; error: string };

/**
 * Redeem a coupon code for the signed-in user via the redeem_coupon RPC.
 * On success, refreshes the cached bonus. `error` is one of the known codes
 * (invalid_code, expired, limit_reached, already_redeemed, not_authenticated).
 */
export async function redeemCoupon(code: string): Promise<RedeemResult> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: 'invalid_code' };

  const { data, error } = await supabase.rpc('redeem_coupon', { coupon_code: trimmed });
  if (error) {
    // The RPC raises plain tokens (e.g. "already_redeemed"); pull a known one
    // out of the Postgres error message, falling back to a generic failure.
    const known = ['not_authenticated', 'invalid_code', 'expired', 'limit_reached', 'already_redeemed'];
    const matched = known.find((k) => error.message?.includes(k));
    return { ok: false, error: matched || 'invalid_code' };
  }

  const workouts = typeof data === 'number' ? data : 0;
  const total = await refreshCouponBonus();
  return { ok: true, workouts, total };
}

/** Human-readable message for a redeem error code. */
export function couponErrorMessage(error: string): string {
  switch (error) {
    case 'not_authenticated':
      return 'Sign in to redeem a code.';
    case 'expired':
      return 'This code has expired.';
    case 'limit_reached':
      return 'This code has been fully redeemed.';
    case 'already_redeemed':
      return "You've already used this code.";
    case 'invalid_code':
    default:
      return "That code isn't valid.";
  }
}

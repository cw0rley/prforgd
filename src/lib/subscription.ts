import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getResults } from '../storage/workoutStorage';

const GRANDFATHERED_KEY = 'prforgd_grandfathered';
const FREE_LIMIT = 10;

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

  // Internal / org accounts (e.g. claytonrugby.com) get unlimited access.
  if (isUnlimitedEmail(await getCurrentEmail())) {
    return { allowed: true, workoutsUsed: count };
  }

  // No account — check local count only
  if (!userId) {
    if (count < FREE_LIMIT) {
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

  // Free tier
  if (count < FREE_LIMIT) {
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
  return Math.max(0, FREE_LIMIT - results.length);
}

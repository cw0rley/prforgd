const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Permanently deletes the authenticated user's account: cancels any Stripe
// subscription, removes all their rows, then deletes the auth user.
// Required by App Store Guideline 5.1.1(v).
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // The caller proves who they are with their own Supabase access token.
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }
  const userId = userData.user.id;

  try {
    // Cancel any Stripe subscription so the user isn't billed after deletion.
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (sub?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      } catch (err) {
        // Already-canceled/expired subscriptions throw — deletion proceeds anyway.
        console.error('Stripe cancel failed:', err.message);
      }
    }

    // Remove all user data, then the auth user itself.
    const tables = ['workout_results', 'favorites', 'user_equipment', 'subscriptions'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      if (error) console.error(`Delete from ${table} failed:`, error.message);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Account deletion failed:', err);
    return res.status(500).json({ error: 'Account deletion failed' });
  }
};

-- Grant lifetime (unlimited) access by email.
-- One-off operational script, not a schema migration. Run in the Supabase SQL Editor.
--
-- Built for the Bootleggers promo (Oct 2026): the mens team are NOT on
-- claytonrugby.com addresses, so the UNLIMITED_EMAIL_DOMAINS allowlist in
-- src/lib/subscription.ts does not cover them. Each one has to be granted here.
--
-- The user must have SIGNED UP ALREADY — the row keys off auth.users, so there is
-- nothing to grant until their account exists.
--
--
-- WHY status = 'active' AND NOT 'grandfathered'
--
-- 'grandfathered' looks like the semantically right value, but it does not work
-- reliably. isGrandfathered() in src/lib/subscription.ts caches its answer in
-- AsyncStorage and returns early on a cached 'false':
--
--     const cached = await AsyncStorage.getItem(GRANDFATHERED_KEY);
--     if (cached === 'false') return false;   // never re-checks the DB
--
-- So anyone who already opened the app has 'false' baked into their device, and
-- granting 'grandfathered' afterwards is invisible to them — they would still get
-- blocked at workout 11, which is exactly the promo falling flat.
--
-- canSaveWorkout() then falls through to getSubscription(), which checks
-- status === 'active' and is read fresh from Supabase every single time, with no
-- cache. That path always works. Nothing in the UI branches on subscription
-- status (the only consumer is app/log/[id].tsx:379), so there is no cosmetic
-- side effect from using 'active' on a non-Stripe account.


-- 1. GRANT -- add one quoted email per line, commas between.
with wanted(email) as (
  values
    ('teammate1@example.com'),
    ('teammate2@example.com')
)
insert into public.subscriptions (user_id, plan, status, current_period_end)
select u.id, null, 'active', '2099-12-31'::timestamptz
from auth.users u
join wanted w on lower(u.email) = lower(w.email)
on conflict (user_id) do update
  set status             = 'active',
      plan               = null,
      current_period_end = '2099-12-31'::timestamptz,
      updated_at         = now();


-- 2. WHO DID NOT MATCH -- typo, or they have not signed up yet.
-- Paste the same list here. Anyone returned did NOT get access.
with wanted(email) as (
  values
    ('teammate1@example.com'),
    ('teammate2@example.com')
)
select w.email as not_found
from wanted w
left join auth.users u on lower(u.email) = lower(w.email)
where u.id is null;


-- 3. VERIFY the grants landed.
select u.email, s.status, s.plan, s.current_period_end, s.updated_at
from public.subscriptions s
join auth.users u on u.id = s.user_id
where s.status = 'active' and s.stripe_subscription_id is null
order by s.updated_at desc;

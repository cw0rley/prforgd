# Coupons — free-workout codes

Reusable campaign codes that grant a user **extra free workouts** on top of the
base free tier (10). One code can be redeemed by many people, each user once.

## Setup (one-time)
Run `scripts/coupons.sql` against the prforgd Supabase project
(`boyjkzbouqqvhnggcgun`) in the SQL editor. It creates:
- `coupons` — the codes.
- `coupon_redemptions` — one row per (user, code); RLS lets a user read only
  their own.
- `redeem_coupon(code)` — `SECURITY DEFINER` function that validates + records a
  redemption atomically and returns the granted workout count.

## Creating codes (SQL editor / admin only — never from the app)
```sql
-- 500 people, +30 workouts each, expires end of 2026
insert into public.coupons (code, workouts, max_redemptions, expires_at, note)
values ('PRFORGD30', 30, 500, '2026-12-31', 'Launch promo');

-- Unlimited redemptions, never expires
insert into public.coupons (code, workouts) values ('FRIENDS', 25);

-- Turn a code off without deleting it
update public.coupons set active = false where code = 'PRFORGD30';

-- See how many times a code has been used
select code, redemptions, max_redemptions from public.coupons;
```
Codes are matched case-insensitively (stored/compared upper-cased).

## How it works in the app
- Redeem UI: `src/components/CouponRedeem.tsx`, shown on the **paywall** and the
  **profile/Me screen** (signed-in users only — redemption needs an account).
- `src/lib/subscription.ts`:
  - `redeemCoupon(code)` → calls the RPC, then `refreshCouponBonus()`.
  - `refreshCouponBonus()` → sums the user's `coupon_redemptions.workouts` and
    caches it locally (per-user, via `localStore`) so the free-limit checks work
    offline. Called on login (`profile.tsx afterLogin`) and after each redeem.
  - `canSaveWorkout` / `getFreeRemaining` use `FREE_LIMIT + couponBonus` as the
    effective allowance.

## Notes / limits
- Bonus is additive and permanent per redemption (a +30 code raises the user's
  free cap to 40; redeeming a second +25 code makes it 65).
- Enforcement matches the existing model (local `results.length` vs. limit) —
  it's honor-system-ish, not a hard server gate, same as the base free tier.
- Anonymous (logged-out) users can't redeem; they're prompted to make an account.

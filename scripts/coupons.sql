-- ===========================================================================
-- Coupons: reusable campaign codes that grant a user extra free workouts.
--
-- Model: one code (e.g. PRFORGD30) can be redeemed by many people, each user
-- once. A code grants `workouts` extra free logs on top of the base free tier.
-- Redemption goes through redeem_coupon() (SECURITY DEFINER) so clients can
-- never forge a redemption or read other people's codes/usage.
--
-- Run once against the prforgd Supabase project (boyjkzbouqqvhnggcgun).
-- ===========================================================================

create table if not exists public.coupons (
  code            text primary key,                 -- stored UPPER-cased
  workouts        integer not null check (workouts > 0),
  max_redemptions integer,                            -- null = unlimited
  redemptions     integer not null default 0,
  expires_at      timestamptz,                        -- null = never expires
  active          boolean not null default true,
  note            text,                               -- optional admin label
  created_at      timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null references public.coupons(code),
  workouts    integer not null,                       -- snapshot of grant size
  redeemed_at timestamptz not null default now(),
  primary key (user_id, code)
);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

-- A user may read their own redemptions (to compute their bonus). There are
-- deliberately NO insert/update/select policies on `coupons` for clients, and
-- no insert/update policies on redemptions — all writes flow through the
-- SECURITY DEFINER function below.
drop policy if exists "read own redemptions" on public.coupon_redemptions;
create policy "read own redemptions" on public.coupon_redemptions
  for select using (auth.uid() = user_id);

-- Redeem a coupon for the currently authenticated user. Atomic (row lock on
-- the coupon) so concurrent redemptions can't exceed max_redemptions. Raises a
-- known error string on failure; returns the granted workout count on success.
create or replace function public.redeem_coupon(coupon_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  c   public.coupons%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into c from public.coupons
    where code = upper(trim(coupon_code))
    for update;

  if not found or not c.active then
    raise exception 'invalid_code';
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    raise exception 'expired';
  end if;
  if c.max_redemptions is not null and c.redemptions >= c.max_redemptions then
    raise exception 'limit_reached';
  end if;
  if exists (
    select 1 from public.coupon_redemptions where user_id = uid and code = c.code
  ) then
    raise exception 'already_redeemed';
  end if;

  insert into public.coupon_redemptions(user_id, code, workouts)
    values (uid, c.code, c.workouts);
  update public.coupons set redemptions = redemptions + 1 where code = c.code;

  return c.workouts;
end;
$$;

grant execute on function public.redeem_coupon(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Creating codes (run as the admin / SQL editor, NOT from the app):
--
--   insert into public.coupons (code, workouts, max_redemptions, expires_at, note)
--   values ('PRFORGD30', 30, 500, '2026-12-31', 'Launch promo');
--
-- Unlimited redemptions, never expires:
--   insert into public.coupons (code, workouts) values ('FRIENDS', 25);
--
-- Disable a code without deleting it:
--   update public.coupons set active = false where code = 'PRFORGD30';
-- ---------------------------------------------------------------------------

# Email confirmation via 6-digit OTP

Native sign-up confirmation used to be a magic link that redirected to the web.
It was flaky on phones (email security scanners pre-fetch the one-time link and
consume the token before the user taps it). We switched to a **6-digit code**
the user types into the app — no redirect, nothing for scanners to consume.

## Code
- `src/lib/auth.ts`
  - `signUp(email, password)` — no `emailRedirectTo` anymore.
  - `verifyEmailOtp(email, token)` — `verifyOtp({ type: 'signup' })`; returns a session.
  - `resendSignupOtp(email)` — `resend({ type: 'signup' })`.
- `app/(tabs)/profile.tsx` — after sign-up, shows a "VERIFY EMAIL" step (code
  input + Verify + Resend) on both web and native.

## Required Supabase dashboard change (one-time)
The confirmation email must send the **code**, not a link.

Dashboard → **Authentication → Email Templates → Confirm signup**. Make sure the
template includes the token, e.g.:

```
<h2>Confirm your signup</h2>
<p>Your PRForgd confirmation code is:</p>
<h1>{{ .Token }}</h1>
<p>Enter this code in the app to finish creating your account.</p>
```

(`{{ .Token }}` is the 6-digit OTP. You can keep `{{ .ConfirmationURL }}` too if
you want a link as a fallback, but the app flow uses the code.)

Also confirm **Authentication → Providers → Email → Confirm email** is ON
(otherwise no code is sent and users are signed in immediately).

Optional: configure custom SMTP (Resend) for Auth emails so confirmation codes
aren't rate-limited by Supabase's built-in sender.

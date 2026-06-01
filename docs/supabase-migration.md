# Supabase Project Migration Guide — PRForgd

Complete step-by-step guide for migrating PRForgd from one Supabase project to another.

All credentials are stored in `migration-keys.csv` (same folder). Key names like `NEW_SUPABASE_URL` reference values in that file.

---

## Phase 1: Collect EVERYTHING from the Old Project

Do all of this before touching the new project. You need credentials, data, and config.

### 1.1 — Export Old Supabase Credentials

Go to **old Supabase project** → **Settings** (gear icon) → **API** (under "Configuration") and save to `migration-keys.csv`:

- [ ] `OLD_SUPABASE_URL` — Project URL at the top of the page
- [ ] `OLD_SUPABASE_ANON_KEY` — under "Project API keys", the one labeled `anon` `public`
- [ ] `OLD_SUPABASE_SERVICE_ROLE_KEY` — under "Project API keys", the one labeled `service_role` `secret` (click eye icon to reveal)

### 1.2 — Export Google OAuth Credentials

Go to **old Supabase project** → **Authentication** → **Providers** → **Google** and save to `migration-keys.csv`:

- [ ] `OLD_GOOGLE_CLIENT_ID`
- [ ] `OLD_GOOGLE_CLIENT_SECRET`
- [ ] `OLD_SUPABASE_CALLBACK_URL` — shown at the bottom of the Google provider section

If you can't see the secret, get it from Google Cloud Console:

1. Go to https://console.cloud.google.com
2. Select your project
3. **APIs & Services** → **Credentials**
4. Click your **OAuth 2.0 Client ID**
5. Copy the **Client ID** and **Client Secret**
6. Also note all the **Authorized redirect URIs** listed

### 1.2b — Export Apple OAuth Credentials

Go to **old Supabase project** → **Authentication** → **Providers** → **Apple** and save to `migration-keys.csv`:

- [ ] `APPLE_SERVICE_ID` — Service ID (Client ID)
- [ ] `APPLE_SECRET_KEY` — Secret Key (p8 file contents or private key)
- [ ] `APPLE_TEAM_ID` — found in old Supabase Apple provider settings. If not shown, go to https://developer.apple.com → **Account** → top-right corner or **Membership details** — 10-character alphanumeric string
- [ ] `APPLE_KEY_ID` — found in old Supabase Apple provider settings. If not shown, go to https://developer.apple.com → **Certificates, Identifiers & Profiles** → **Keys** → click your "Sign in with Apple" key — Key ID shown at top (10-character alphanumeric string)
- [ ] Authorized Redirect URI (shown at the bottom of the Apple provider section — same as `OLD_SUPABASE_CALLBACK_URL`)

If you need to find any of these again, go to https://developer.apple.com:

1. **Team ID:** Sign in → **Account** → top-right corner or **Membership details** page
2. **Key ID:** **Certificates, Identifiers & Profiles** → **Keys** → click your key → shown at top
3. **Service ID:** **Certificates, Identifiers & Profiles** → **Identifiers** → filter by **Services IDs** → click yours → copy the identifier string
4. If you still have the **.p8 key file** you downloaded when creating the key, save it — you cannot re-download it from Apple

### 1.3 — Export Table Data as CSV

Go to **old Supabase project** → **SQL Editor** and run each query below one at a time. After each query, click **Download CSV** to save the results.

**Query 1 — Workout Results:**
```sql
SELECT * FROM workout_results;
```
Save as: `workout_results.csv`

**Query 2 — Favorites:**
```sql
SELECT * FROM favorites;
```
Save as: `favorites.csv`

**Query 3 — User Equipment:**
```sql
SELECT * FROM user_equipment;
```
Save as: `user_equipment.csv`

**Note:** If the CSV has an `id` column that doesn't exist in the new schema (e.g. `user_equipment`), delete that column from the CSV before importing.

**Query 4 — Subscriptions:**
```sql
SELECT * FROM subscriptions;
```
Save as: `subscriptions.csv`

### 1.4 — Note Your Old User ID

Go to **old Supabase project** → **Authentication** → **Users**.

- [ ] `OLD_USER_ID` — copy your user UUID

You'll need this to find-and-replace in the CSVs later.

### 1.5 — Check for Database Webhooks

Go to **old Supabase project** → **Integrations** (puzzle piece icon) → **Database Webhooks** → **Webhooks** tab.

- [ ] Screenshot or note any webhooks configured (table, event, URL, headers)

### 1.6 — Check Supabase Auth Settings

Go to **old Supabase project** → **Authentication** → **URL Configuration**.

- [ ] `SITE_URL` — Site URL
- [ ] `REDIRECT_URL` — Redirect URLs (list of allowed redirect URLs)

### 1.7 — Export Custom Email Templates

Go to **old Supabase project** → **Authentication** → **Email Templates**. For each template that you customized, copy the HTML and save it:

1. Click **Confirm signup** tab → copy the **Subject** and **Body (HTML)** → save to a file `confirm-signup.html`
2. Click **Magic Link / OTP** tab → copy the **Subject** and **Body (HTML)** → save to a file `magic-link-otp.html`
3. Click **Change Email Address** tab → copy if customized → save to `change-email.html`
4. Click **Reset Password** tab → copy if customized → save to `reset-password.html`
5. Click **Invite User** tab → copy if customized → save to `invite-user.html`

- [ ] Confirm signup template saved
- [ ] Magic Link / OTP template saved
- [ ] Change Email Address template saved (if customized)
- [ ] Reset Password template saved (if customized)
- [ ] Invite User template saved (if customized)

---

## Phase 2: Set Up the New Supabase Project

### 2.1 — Create the Project

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Choose your organization
4. Enter project name: `prforgd`
5. Set a strong database password — save as `NEW_DB_PASSWORD` in `migration-keys.csv`
6. Choose region closest to your users
7. Click **Create new project**
8. Wait for it to finish provisioning

### 2.2 — Save New Project Credentials

Go to the sidebar: **Settings** (gear icon) → **API** (under "Configuration"). You'll see the **Project URL** at the top and **Project API keys** below it. Save to `migration-keys.csv`:

- [ ] `NEW_SUPABASE_URL` — shown at the top of the API settings page
- [ ] `NEW_SUPABASE_REF` — the subdomain part of the Project URL (the `yyyyy` in `https://yyyyy.supabase.co`)
- [ ] `NEW_SUPABASE_ANON_KEY` — under "Project API keys", the one labeled `anon` `public`
- [ ] `NEW_SUPABASE_SERVICE_ROLE_KEY` — under "Project API keys", the one labeled `service_role` `secret` (click the eye icon to reveal it)

### 2.3 — Create the Database Schema

1. Go to **SQL Editor** → **New query**
2. Open `migration-schema.sql` (same folder as this file) and paste its entire contents
3. Click **Run**
4. Verify: Go to **Table Editor** — you should see all 4 tables (workout_results, favorites, user_equipment, subscriptions)

### 2.4 — Create Your User Account

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter your email address (same one you use with Google)
4. Enter any password
5. Check **Auto Confirm User**
6. Click **Create user**
7. Save your **new user UUID** as `NEW_USER_ID` in `migration-keys.csv`

### 2.5 — Update CSVs with New User ID

Open each CSV file you exported in Step 1.3 in a text editor (Notepad, VS Code, etc.):

1. **Find:** `OLD_USER_ID` value
2. **Replace:** `NEW_USER_ID` value
3. Save each file

Do this for all 4 CSVs:
- `workout_results.csv`
- `favorites.csv`
- `user_equipment.csv`
- `subscriptions.csv`

### 2.6 — Import Data

Go to **Table Editor** in the new project. For each table, in this exact order:

**Order matters — import in this sequence:**

1. **subscriptions** (no dependencies besides user)
2. **user_equipment** (no dependencies besides user)
3. **favorites** (no dependencies besides user)
4. **workout_results** (no dependencies besides user)

For each table:

1. Click the table name
2. Click **Insert** → **Import data from CSV**
3. Upload the matching CSV file
4. Verify the column mapping looks correct
5. Click **Import**

If CSV import gives "Data incompatible" errors, use the SQL Editor instead. Open the CSV in a text editor, then write INSERT statements manually:

```sql
-- Example for subscriptions (replace values with your CSV data)
INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at)
VALUES ('<NEW_USER_ID>', 'yearly', 'active', 'cus_xxx', 'sub_xxx', '2026-12-01T00:00:00Z', NOW(), NOW());
```

### 2.7 — Create a New Google Cloud Project & OAuth Credentials

If PRForgd needs its own Google Cloud project (recommended to keep things separate):

**Create the project:**
1. Go to https://console.cloud.google.com
2. Click the **project dropdown** at the top-left (next to "Google Cloud")
3. Click **New Project**
4. Name it `PRForgd`
5. Click **Create**
6. Select the new `PRForgd` project from the dropdown

**Set up OAuth consent screen:**
7. Go to **APIs & Services** → **OAuth consent screen**
8. Choose **External** → click **Create**
9. Fill in:
   - **App name:** `PRForgd`
   - **User support email:** your email (select from dropdown — must be the Google account you're logged in with)
   - **Developer contact email:** your email (type it in the text field)
10. Click **Save and Continue** through the remaining steps (Scopes, Test Users) — defaults are fine
11. Click **Back to Dashboard**

**Create OAuth credentials:**
12. Go to **APIs & Services** → **Credentials**
13. Click **+ Create Credentials** → **OAuth client ID**
14. **Application type:** Web application
15. **Name:** `PRForgd`
16. Under **Authorized redirect URIs**, click **Add URI** and enter: `<NEW_SUPABASE_CALLBACK_URL>`
    (This is `NEW_SUPABASE_URL` + `/auth/v1/callback`. You can also find it in Supabase → **Authentication** → **Providers** → **Google** — the callback URL is shown at the bottom once enabled)
17. Click **Create**
18. Save the **Client ID** as `NEW_GOOGLE_CLIENT_ID` and **Client Secret** as `NEW_GOOGLE_CLIENT_SECRET` in `migration-keys.csv`

**If reusing an existing Google Cloud project instead**, just add `<NEW_SUPABASE_CALLBACK_URL>` to your existing OAuth client's redirect URIs.

### 2.7b — Set Up Google Provider in Supabase

1. Go to new Supabase project → **Authentication** → **Providers** → **Google**
2. Toggle **Enable Google provider** ON
3. Paste `NEW_GOOGLE_CLIENT_ID`
4. Paste `NEW_GOOGLE_CLIENT_SECRET`
5. Copy the **Callback URL** shown — verify it matches `NEW_SUPABASE_CALLBACK_URL`
6. Click **Save**

### 2.7c — Set Up Apple OAuth Provider

1. Go to **Authentication** → **Providers** → **Apple**
2. Toggle **Enable Apple provider** ON
3. Paste `APPLE_SERVICE_ID`
4. Paste `APPLE_SECRET_KEY`
5. Fill in `APPLE_TEAM_ID` and `APPLE_KEY_ID` if the fields are shown (some Supabase versions don't show these)
6. Copy the **Callback URL** shown — it should match `NEW_SUPABASE_CALLBACK_URL`
7. Click **Save**

### 2.8b — Update Apple Developer Console

1. Go to https://developer.apple.com → **Certificates, Identifiers & Profiles**
2. Go to **Identifiers**
3. **Important:** Change the filter dropdown (top-right) from **App IDs** to **Services IDs** — your Services ID won't show up otherwise
4. Click your Services ID (`APPLE_SERVICE_ID`)
5. Check **Sign in with Apple** (if not already checked) → click **Configure**
6. Under **Website URLs**:
   - **Domains:** add `NEW_SUPABASE_REF` + `.supabase.co`
   - **Return URLs:** add `NEW_SUPABASE_CALLBACK_URL`
   - Optionally remove the old Supabase domain/URL
7. Click **Save** → **Continue** → **Save**

**Do NOT edit the App ID** — the redirect URL goes on the **Services ID**, not the App ID.

### 2.9 — Configure Auth Settings

Go to new Supabase project → **Authentication** → **URL Configuration**:

1. Set **Site URL** to: `SITE_URL`
2. Add **Redirect URLs**:
   - `REDIRECT_URL`
   - `http://localhost:8081/**` (for local dev)
3. Click **Save**

### 2.9b — Import Custom Email Templates & Set Up Custom SMTP

Go to new Supabase project → **Authentication** (left sidebar, person/shield icon) → **Emails** (under "Notifications").

Branded templates are in `email-templates/` (same folder as this file):

1. **Confirm signup** tab:
   - Subject: `Confirm your PRForgd email`
   - Body: paste contents of `email-templates/confirm-signup.html`
   - Click **Save**

2. **Magic Link / OTP** tab:
   - Subject: `Sign in to PRForgd`
   - Body: paste contents of `email-templates/magic-link-otp.html`
   - Click **Save**

3. **Change Email Address** — paste saved template from Step 1.7 if customized
4. **Reset Password** — paste saved template from Step 1.7 if customized
5. **Invite User** — paste saved template from Step 1.7 if customized

- [ ] Confirm signup
- [ ] Magic Link / OTP
- [ ] Change Email Address (if customized)
- [ ] Reset Password (if customized)
- [ ] Invite User (if customized)

**Set up Custom SMTP** (so auth emails come from `noreply@prforgd.com` instead of Supabase's default):

On the same **Emails** page, scroll down to **SMTP Settings**:

1. Toggle **Enable Custom SMTP** ON
2. **Sender email:** `noreply@prforgd.com`
3. **Sender name:** `PRForgd`
4. **Host:** `smtp.resend.com`
5. **Port:** `465`
6. **Username:** `resend`
7. **Password:** `RESEND_API_KEY` value from `migration-keys.csv`
8. Click **Save**

Note: After enabling custom SMTP, go to **Rate Limits** (under Configuration) and increase the email rate limit from the default 30/hour if needed.

### 2.10 — Set Up Database Webhook (Welcome Email)

1. Go to **Integrations** (puzzle piece icon in the sidebar) → **Database Webhooks** (under "Installed")
2. Click the **Webhooks** tab (next to "Overview")
3. Click **Create a new webhook**
4. **Name:** `welcome-email`
5. **Table:** select `auth` schema, then `users` table
6. **Events:** check `INSERT`
7. **Type:** HTTP Request
8. **Method:** POST
9. **URL:** `https://prforgd.com/api/welcome-email`
10. **Add header:**
    - Key: `Authorization`
    - Value: `Bearer ` + `SUPABASE_WEBHOOK_SECRET`
11. Click **Create webhook**

---

## Phase 3: Update the App

### 3.1 — Update Supabase Credentials in Code

Edit `src/lib/supabase.ts` and replace:

- **SUPABASE_URL** → `NEW_SUPABASE_URL`
- **SUPABASE_ANON_KEY** → `NEW_SUPABASE_ANON_KEY`

### 3.2 — Update Vercel Environment Variables

Run these commands (or do it in the Vercel dashboard):

```bash
# Remove old values
vercel env rm SUPABASE_URL production --yes
vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes

# Add new values (replace with actual values from migration-keys.csv)
vercel env add SUPABASE_URL production --value "<NEW_SUPABASE_URL>" --yes
vercel env add SUPABASE_SERVICE_ROLE_KEY production --value "<NEW_SUPABASE_SERVICE_ROLE_KEY>" --yes
```

Also verify these env vars are set:
- `RESEND_API_KEY`
- `SUPABASE_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 3.3 — Deploy

**Important:** Vercel deploys from the `dist/` folder, NOT the project root.

```bash
cd prforgd

# 1. Build the web export
npx expo export --platform web

# 2. Copy API files and vercel.json into dist (expo export overwrites dist/)
cp -r api dist/api
cp vercel.json dist/vercel.json

# 3. Fix fonts — Vercel ignores node_modules, so rename to vendor
mv dist/assets/node_modules dist/assets/vendor
# Update font references in the JS bundle
sed -i 's|node_modules/|vendor/|g' dist/_expo/static/js/web/entry-*.js

# 4. Deploy from dist/
cd dist
vercel --prod --yes
```

### 3.4 — Test

1. Open https://prforgd.com
2. Sign in with Google
3. Sign in with Apple
4. Verify your workout data is there
5. Log a test workout and confirm it saves
6. Check Supabase **Table Editor** to confirm data is in the new project

---

## Phase 3b: Set Up Resend (Transactional Emails)

PRForgd uses Resend to send welcome emails, subscription confirmations, and cancellation emails.

### 3b.1 — Create Resend Account & API Key

1. Go to https://resend.com and sign up (or log in)
2. Go to **API Keys** (left sidebar)
3. Click **+ Create API key**
4. **Name:** `prforgd`
5. **Permission:** Sending access (default)
6. **Domain:** select your domain or "All domains"
7. Click **Create**
8. Copy the API key (starts with `re_`) — save as `RESEND_API_KEY` in `migration-keys.csv`

### 3b.2 — Add Domain to Resend

1. Go to **Domains** (left sidebar)
2. Click **Add Domain**
3. Enter: `prforgd.com`
4. Click **Add**
5. Resend will show you DNS records to add — **keep this page open**, you'll need it for the next step

### 3b.3 — Add DNS Records in Squarespace

1. Go to https://account.squarespace.com
2. Click your domain (`prforgd.com`) → **DNS** or **DNS Settings**
3. For each record Resend shows, click **Add Record** and enter:

**Record 1 — SPF (TXT):**
- Type: `TXT`
- Host/Name: copy from Resend (usually `@` or blank)
- Value: copy from Resend (looks like `v=spf1 include:amazonses.com ~all`)

**Record 2 — DKIM (CNAME or TXT):**
Resend typically gives you 3 DKIM records. For each one:
- Type: `CNAME` (or `TXT` — match what Resend shows)
- Host/Name: copy from Resend (looks like `resend._domainkey` or similar)
- Value: copy from Resend

**Record 3 — MX (if shown):**
- Type: `MX`
- Host/Name: copy from Resend
- Priority: copy from Resend
- Value: copy from Resend

4. Click **Save** for each record
5. DNS can take up to 48 hours to propagate, but usually works within minutes

### 3b.4 — Verify Domain in Resend

1. Go back to Resend → **Domains**
2. Click **Verify** next to `prforgd.com`
3. Wait for all records to show green checkmarks
4. If verification fails, double-check the DNS records in Squarespace — make sure there are no extra spaces or missing characters

### 3b.5 — Add Resend API Key to Vercel

```bash
vercel env add RESEND_API_KEY production --value "<RESEND_API_KEY>" --yes
```

Or add it in the Vercel dashboard: **Settings** → **Environment Variables** → add `RESEND_API_KEY`.

### 3b.6 — Test Emails

1. Create a new account on prforgd.com — you should receive a welcome email
2. Subscribe via Stripe — you should receive a subscription confirmation email
3. Check Resend dashboard → **Emails** to see sent emails and any errors

---

## Phase 4: Cleanup

Once everything works on the new project:

1. Remove the old Supabase callback URL from Google Cloud Console:
   - Go to https://console.cloud.google.com
   - Select the **old** Google Cloud project (not the new PRForgd one)
   - Go to **APIs & Services** → **Credentials**
   - Click your **OAuth 2.0 Client ID**
   - Under **Authorized redirect URIs**, delete: `OLD_SUPABASE_CALLBACK_URL`
   - Click **Save**
   - If this was the only app using this Google Cloud project, you can delete the entire project: **Settings** (top-left hamburger menu) → **IAM & Admin** → **Settings** → **Shut down project**
2. Remove the old Supabase domain/URL from Apple Developer Console:
   - Go to https://developer.apple.com → **Certificates, Identifiers & Profiles**
   - Go to **Identifiers** → change filter dropdown to **Services IDs**
   - Click your Services ID (`APPLE_SERVICE_ID`)
   - Click **Sign in with Apple** → **Configure**
   - Under **Website URLs**:
     - Remove the old domain (the `OLD_SUPABASE_REF` + `.supabase.co`)
     - Remove the old return URL (`OLD_SUPABASE_CALLBACK_URL`)
   - Verify the new ones are still there (`NEW_SUPABASE_REF` + `.supabase.co` and `NEW_SUPABASE_CALLBACK_URL`)
   - Click **Save** → **Continue** → **Save**
3. Pause or delete the old Supabase project
4. Delete the exported CSV files (they contain user data)
5. Delete `migration-keys.csv` (contains secrets)
6. Remove old AWS SES DNS records from Squarespace (no longer needed since Resend replaces SES):
   - Go to https://account.squarespace.com → your domain → **DNS Settings**
   - Delete these records (they were for the old AWS SES setup):
     - MX record: `mail` → `feedback-smtp.us-east-1.amazonses.com`
     - TXT record: `mail` → `v=spf1 include:amazonses.com ~all`
   - **Keep** these records (needed for Resend):
     - TXT record: `resend._domainkey` → `p=MIGfMA0GCSqG...`
     - MX record: `send` → `feedback-smtp.us-east-1.amazonses.com`
     - TXT record: `send` → `v=spf1 include:amazonses.com ~all`
   - **Keep** these records (needed for Vercel):
     - A record: `@` → `76.76.21.21`
     - CNAME record: `www` → `cname.vercel-dns.com`
   - **Keep** DKIM CNAME records (needed for email delivery)

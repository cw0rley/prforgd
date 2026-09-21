# PRForgd — Full Memory Transfer

> Consolidated export of all persistent memory files for the PRForgd project, generated 2026-09-21.
> Source: `C:\Users\pat\.claude\projects\C--Code-personal-prforgd\memory\`
> Each section below was one memory file. **Dates and file:line citations are point-in-time — verify against current code before relying on them.**
>
> **User:** pat@claytonrugby.com. **Today when exported:** 2026-09-21.

---

## INDEX (MEMORY.md)

### User Conventions
- Screenshots named `claude.png` are always in `C:\Users\pat\Downloads\`.
- **Back-arrow centering** — MEASURE the chevron offset from a screenshot (don't eyeball); current values translateX 1 / translateY -9. UI buttons must account for screen width (two rows, `numberOfLines={1}`), never let labels wrap. (See "back-arrow-centering" section.)
- **Cut/paste text as files** — write copy/paste-intended text to `.txt` files in `cut-paste/`, never inline in CLI.
- **Docs location** — user-facing reference docs go in project-root `Workout\docs\`, NOT `prforgd\docs\`.

### Project Overview
- **App Name: PRForgd** (domain: prforgd.com)
- App folder: `prforgd/` (lowercase, renamed from hero-wod-tracker)
- Data/reference files: `data/` folder at project root (same level as `videos/`)
- CrossFit workout tracking app (Hero WODs, Girl WODs, Benchmarks)
- Built with Expo (React Native) + TypeScript for web, iOS, Android
- File-based routing with expo-router (tab layout)
- PWA configured for "Add to Home Screen"
- Deployed on Vercel, code on GitHub (private repo: cw0rley/prforgd)

### Deploy Process (CRITICAL)
- Vercel deploys from `dist/` folder, NOT project root.
- **MUST run `node scripts/post-export.js` after expo export** — it flattens fonts from node_modules path to assets/fonts/ (Vercel ignores node_modules paths!) and injects PWA tags.
- Without post-export.js, tab bar icons (Ionicons) will be MISSING on web.
- `dist/.vercel/project.json` must point to prforgd project ID.

### Access / Subscriptions
- claytonrugby.com emails get UNLIMITED access (bypass free limit + paywall) — `UNLIMITED_EMAIL_DOMAINS` in `src/lib/subscription.ts`.
- EAS build Windows gotchas — requireCommit + expo-audio dep pinning needed for builds to succeed.
- Play service account — EAS Android auto-submit now works (key at prforgd/google-service-account.json, gitignored).

### Supabase
- Auth getUser() lock gotcha — use `getSession()` (local) not `getUser()` (network) in hot paths.
- User preferences sync — Favs/My Gear filter toggles now per-user + cloud-synced; **pending migration** `create-user-preferences-table.sql`.
- NEW project: `boyjkzbouqqvhnggcgun` (URL: https://boyjkzbouqqvhnggcgun.supabase.co)
- OLD project: `uqtlqprxepcpajvrxies` (being migrated away from)
- Auth: Google + Apple sign-in.
- Tables: workout_results, favorites, user_equipment, subscriptions.
- Migration guide: `prforgd/docs/supabase-migration.md`.

### Email (Resend)
- Resend for transactional emails (welcome, subscription confirmation, cancellation).
- API files: `api/_lib/emails.js`, `api/welcome-email.js`.
- Supabase webhook triggers welcome email on auth.users INSERT.
- OTP length gotcha — signup breaks unless Supabase Email OTP Length = 6 (app hard-locks to 6 digits).

### Current Status (updated 2026-08-06)
- **v1.0.6 FULLY SUBMITTED TO PRODUCTION across all three surfaces.**
  - **Web:** deployed to prforgd.com (Vercel dpl `59LkxWTXmrHdQavxuQA8zp2ZbeCo`), live/200.
  - **iOS:** build 29 (1.0.6) submitted for App Store review (user did the ASC submit-for-review step). Prior TestFlight builds 27/28 superseded.
  - **Android:** versionCode 16 (1.0.6) built on EAS + auto-submitted to Play **production** track. Awaiting Google review/rollout.
- **This session's changes (all committed on `main`, latest `e7d8ed3`):**
  - Timer screen (`app/log/[id].tsx`): split bottom action buttons into TWO rows so labels never wrap on narrow screens (RESUME was wrapping); added `numberOfLines={1}` to all. **User feedback: buttons must account for screen width — never let them wrap.**
  - Log/history search: added a search box on the WORKOUT LOG tab (`app/(tabs)/history.tsx`) filtering by workout name.
  - **Header icon centering** (see back-arrow-centering). Back-arrow chevron (all 7 header screens) → `translateX 1, translateY -9`; favorite star (`wod/[id].tsx`) → `translateY -8`. Values were MEASURED from a screenshot (user asked 4×; eyeballing failed). MEASURE, don't guess.
  - Workout data: `Joshua H. Reeves` dumbbell snatch now `(55/35 lb)`. **Workouts live in Supabase `workouts` table (runtime source); `heroWods.ts` is only the offline fallback.** User updated the DB row directly; static fallback + `scripts/update-joshua-h-reeves-weight.sql` committed.
- **Release notes** for 1.0.6: `cut-paste/whats-new-1.0.6.txt` (project-root cut-paste).
- **Open/next:** post-approval store rollout is the waiting game (Apple ~24-48h, Google varies). Pre-existing harmless bug: missing `rxBtnSizer` style in `log/[id].tsx` (log-mode RX toggle could show a stray "SCALED" label) — not yet fixed. Android may still show 2 non-blocking Play warnings (edge-to-edge, large-screen resizability).

### Current Status (updated 2026-07-30)
- **Big feature session — all shipped to web (prforgd.com) + committed/pushed to `main` (latest `aa0b02e`).**
- **Leaderboard FEATURE COMPLETE** (Rx-only) — Phases 1-4 live. Migrations RUN in Supabase `boyjkzbouqqvhnggcgun`: profiles, user_preferences, `workout_results.is_public`, `leaderboard_entries` view. Reached via "VIEW LEADERBOARD" button on WOD detail; submit via "BOARD" toggle on Rx Log entries (needs a username first).
- **Share a result** — `src/lib/share.ts`; SHARE button on Log entries + post-workout. Format: `Name — time Rx` / blank / full workout / blank / footer+link. Native share sheet on mobile, clipboard on desktop.
- **Landing page is now a HARD gate** (was soft) — logged-out web = always landing; brand-kit header (white "PR FORGD"), social icons, app-store badges. Fixed Google-login landing flash + a **critical getUser() auth-lock hang**.
- **Favorites**: Log star now WOD-level/synced; star on WOD detail. **Filter toggles** (Favs/My Gear) now per-user + cloud-synced.
- **Fixed blank User Manual** (missing TouchableOpacity import in `app/help.tsx`).
- **Log action buttons** retidied into two equal-width rows (DO AGAIN/LOG ; SHARE/BOARD/DELETE).
- **NATIVE: iOS 1.0.6 build 26 submitted to TestFlight** (also build 25). Version bumped 1.0.5→**1.0.6**. Build 24 (1.0.5) FAILED submit — Apple rejects re-submitting an existing version, must bump `expo.version`. **Android NOT rebuilt this session** (app.json version is 1.0.6 but Android versionCode still 15 — needs a build+bump). iOS 1.0.6 is TestFlight-only; not yet submitted for App Store review.
- **Docs for user** (in project-root `Workout\docs\`): `adding-workouts.md` (WOD add format) + `all-workouts.md` (all 314 live workouts exported 2026-07-30: 214 hero / 25 girl / 75 benchmark).
- **NEXT / open:** user may send new workouts (has the format doc); Android 1.0.6 build if wanted; eventually submit iOS 1.0.6 for App Store review; leaderboard backlog (gym/region filters, moderation). Stray dev servers may be running (ports 8090/8092) — harmless.

### Current Status (updated 2026-07-27)
- **Marketing landing page SHIPPED to web** — logged-out visitors to prforgd.com now hit a soft-gate front page (hero + phone mockup, stats, how-it-works, features, FAQ, CTA, footer). Web-only; native untouched. Deployed via Vercel (dpl `Fo9HCG6dJDLxorseo6HMihaTbj3Z`). Files: `src/components/LandingGate.tsx`, `app/_layout.tsx`.
- **Signup outage fixed** — Supabase Email OTP Length was 8 but app hard-locks to 6; set back to 6, user re-registered. Added the setting step to `docs/supabase-migration.md`.
- **Brand wordmark added** — `brand-kit/wordmark.svg` + `wordmark.png` (1200x480, transparent), matching the header-800 lockup.
- Temp `.svg-render/` folder left at project ROOT (outside repo) — safe to delete manually.

### Current Status (updated 2026-07-16)
- **v1.0.5 SHIPPED — web + native, fully submitted.** Web live on prforgd.com; iOS build 23 + Android versionCode 15 built on EAS (both FINISHED) with `--auto-submit`; both submissions landed. **iOS 1.0.5 build 23 submitted for review in ASC** (done by user). **Android 1.0.5 (vc 15) LIVE on Play production track**. Commits on `main`: `a68701a` (the two fixes), `a445c47` (version bump), `79ed1e1` (gitignore cut-paste/).
- **Changes in v1.0.5:** (1) Timer band RX pill kept fixed-size via 3-column layout — no longer shrinks & wraps R/X when the clock passes 1 hour. (2) Back-arrow optical centering — `chevron-back` nudged `translateX: -4` so it reads centered in the iOS Button-Shapes oval; applied to all 6 header screens.
- Play production still shows 2 non-blocking recommended actions (edge-to-edge deprecated APIs + large-screen resizability).
- Added `cut-paste/` to `.gitignore`.

### Prior Status (updated 2026-07-09)
- **iOS v1.0.4 build 22** submitted to App Store Connect. User needs to create v1.0.4 in ASC, then add build 22 and submit for review.
- **Android v1.0.4 versionCode 14** submitted to **production** track. Two non-blocking warnings (edge-to-edge, large-screen resizability).
- `eas.json` Android submit track changed from `internal` → `production` (commit 0e46b65).
- **Changes in v1.0.4 (commit 0e46b65):** RX toggle alignment fix; videos fixed (Linking.openURL replaces WebBrowser); consistent back buttons (Ionicons size 32); favs filter in history fixed; RX toggle moved to fixed bottom bar.

### Prior Status (updated 2026-06-10)
- Paywall/subscription system built with Stripe Payment Links integrated.
- Stripe webhook (api/stripe-webhook.js) deployed, tested end-to-end.
- **iOS build 5 REJECTED Jun 10** — Guideline 5.1.1(v): no account deletion. Account deletion BUILT + tested vs production (api/delete-account.js + DELETE ACCOUNT button; commit 716c642); privacy policy updated.
- **iOS 1.0.1 build 8 submitted to ASC Jun 10 evening** (EAS submission 310bb9bc). Fixes in commit 978b3d7 (safe-area top padding; native Google sign-in via WebBrowser.openAuthSessionAsync + setSession).
- **Build 8 VERIFIED on physical device Jun 10 night**: required adding `prforgd://auth/callback` to Supabase Auth → URL Configuration → Redirect URLs.
- Web deployed to Vercel prod.
- Android: build (versionCode 3) uploaded manually to Closed testing track.
- Soft-delete shipped to web: workout_results has `deleted_at` column (migration scripts/add-deleted-at-column.sql).
- Repo housekeeping: SQL consolidated into `scripts/`; `dist3-6/` are stale build artifacts.
- When user asks "whats next" → refer to features (this doc).

### Planned Work
- Email confirm flaky on native — fast-follow fix (not blocking); add emailRedirectTo + verify Site URL.
- Build 9 follow-ups — web SHIPPED 2026-06-12 (sync rework, show-password, web Me screen). NEXT: submit native build 9 (v1.0.2) ONLY after build 8 is APPROVED in ASC; test sync on a physical device first.
- Leaderboard feature — SHIPPED (see leaderboard section).
- Web login divergence — SHIPPED 2026-06-10 (centered card, commit a11d663).
- Coupons + email OTP — built 2026-06-17.
- Sync data-loss fix — CRITICAL: save/sync race silently dropped just-logged workouts. Fixed (commit 4f86170, web live).

---

## features (features.md)

# PRForgd Feature List

## Implemented
- 200+ WODs (Hero, Girl, Benchmark — growing)
- 130 exercise movements with YouTube video demos
- Inline video player (YouTube embed modal on WOD detail + Moves tab)
- Live workout timer with START/PAUSE/STOP/RESUME/RESET (all in bottom bar)
- Round tracking with per-round split times
- Manual workout logging with date entry
- Rx toggle (as prescribed or scaled)
- PR auto-detection (Rx results only, not triggered on first workout)
- Workout history log with filters: ALL, PRs, Rx, Scaled
- Favorites (star WODs)
- Filter chips (horizontal scroll): Favs, My Gear, All/Hero/Girl/Benchmark, Branch, Type
- Always sorted A-Z
- Equipment-based WOD filtering (My Gear)
- Equipment selection screen (14 equipment types inc. pool) - titled "MY GEAR"
- WOD Generator (random WODs based on equipment, only movements with videos)
- Custom WOD builder (name, type, rounds/time cap, workout text)
- Edit generated WODs before starting
- Workout scanning (OCR) via expo-image-picker + tesseract.js on Build tab
- Replay any logged workout from history
- CSV/JSON data export via clipboard (on Log page with download icon)
- Bottom tab navigation: WODs, Create, Log, Gear, Moves, Me
- Ionicons for consistent icons across all platforms (green active, muted inactive)
- User accounts (Supabase - Google OAuth + Apple Sign In + email/password)
- Cloud sync with MERGE logic (merge by unique id, union of both sets, nothing gets wiped)
- PWA support (Add to Home Screen on iOS/Android)
- Keep-awake app-wide (screen never sleeps)
- Responsive design (phone + desktop, bigger text on PC)
- PRForgd app icon (SVG + PNG) shown on WODs page top right
- Brand kit with SVG/PNG icons, headers, favicons (brand-kit/ folder)
- Seahawks-inspired color scheme
- Themed scrollbars (dark navy track, cardBorder thumb)
- Safe area handling: env(safe-area-inset-bottom) + viewport-fit=cover for iPhone
- Safe area top padding via CSS env(safe-area-inset-top) on #root for iPhone PWA
- All page titles centered and green
- All subtitle/description text white
- Sync button with description explaining merge behavior
- Rx/Scaled badge shown on log screen below workout name
- In-app user manual page (accessible from Me tab)
- User manual + video script docs in docs/ folder

## Implemented — Paywall / Subscriptions
- Freemium model: 10 free saved workouts, then subscription required
- Pricing: $1.99/month or $19.99/year
- Stripe Payment Links (live mode) + webhook (api/stripe-webhook.js)
- Webhook → Supabase subscriptions table, tested end-to-end
- Grandfathering: existing users with >10 workouts auto-grandfathered
- All window.alert popups replaced with inline Toast component

## Submitted — App Store Submission
- iOS build submitted to App Store Connect (review pending)
- Android closed testing submitted to Google Play (review pending, promote to Production after approval)
- Store listing in docs/store-listing.md
- Screenshots: 7 phone + 1 iPad
- Feature graphic: brand-kit/feature-graphic.html (screenshot at 1024x500)
- EAS builds: eas build --platform all --profile production
- iOS submit: eas submit --platform ios --latest
- Android: manual .aab upload to Google Play Console

## Other Planned / Future
- Apple Sign In (configured in Supabase, button added, debugging invalid_client error)
- Facebook Sign In
- Warmup generator (was built, then removed - can re-add)
- Progress charts/graphs (PR trends over time)
- Workout calendar (see which days you trained)
- Barbell plate calculator
- 1RM calculator
- Workout streak tracker
- Share results
- Scaling suggestions per WOD
- Rest timer with sound
- Body weight tracking
- Leaderboard
- Training programs
- Custom exercise videos

---

## technical (technical.md)

# PRForgd Technical Details

## Project Structure
- App lives in: `prforgd/`
- `app/(tabs)/` - Tab screens: index, create, history, equipment, movements, profile
- `app/(tabs)/_layout.tsx` - Tab bar config with Ionicons, responsive sizing
- `app/_layout.tsx` - Root layout, useKeepAwake app-wide, OAuth callback handler
- `app/wod/[id].tsx` - WOD detail page with START/LOG bottom bar + inline video modal
- `app/log/[id].tsx` - Timer/log screen with bottom action buttons (supports id=custom)
- `app/export.tsx` - CSV/JSON export
- `src/data/heroWods.ts` - All 168 WODs (hero, girl, benchmark groups)
- `src/data/movements.ts` - 130 movements with video URLs + findMovement() helper
- `src/data/equipment.ts` - 14 equipment types + movement-to-equipment mapping (130+ entries)
- `src/data/wodGenerator.ts` - WOD generator (filters by equipment + video availability)
- `src/storage/workoutStorage.ts` - AsyncStorage CRUD + auto cloud sync on save
- `src/storage/equipmentStorage.ts` - User equipment preferences
- `src/storage/favoritesStorage.ts` - Favorite WODs
- `src/storage/generatedWodStorage.ts` - Temp storage for generated/custom WODs
- `src/lib/supabase.ts` - Supabase client config
- `src/lib/auth.ts` - Auth helpers (signUp, signIn, signOut, getSession, onAuthChange)
- `src/lib/sync.ts` - Cloud sync with MERGE logic (fullSync returns SyncStats)
- `src/components/Toast.tsx` - Reusable Toast notification component (replaces Alert/window.alert)
- `api/stripe-webhook.js` - Stripe webhook handler (Vercel serverless function)
- `src/theme.ts` - Colors and spacing
- `public/` - PWA manifest, icons
- `scripts/post-export.js` - Build post-processing (PWA tags, fonts, safe area CSS, viewport-fit)
- `scripts/generate-apple-secret.js` - Apple Sign In JWT generator
- `brand-kit/` - Brand assets: SVGs, outlined SVGs, PNGs, favicon.ico
- `vercel.json` - SPA rewrites for Vercel
- `prforgd-workouts.csv` - Exported CSV of all WODs

## Tech Stack
- Expo SDK 54, React Native 0.81.5, React 19.1.0
- expo-router with bottom tab navigation (6 tabs)
- @expo/vector-icons (Ionicons) for tab icons
- @react-native-async-storage/async-storage for local data
- @supabase/supabase-js for auth + cloud sync
- stripe for payment webhook verification
- expo-clipboard for data export
- expo-keep-awake (app-wide)
- Node v20.17.0
- Vercel for deployment
- GitHub: cw0rley/prforgd (private)

## Supabase Config
- Project ref: uqtlqprxepcpajvrxies (NOTE: this is the OLD project; new project is boyjkzbouqqvhnggcgun)
- URL: https://uqtlqprxepcpajvrxies.supabase.co
- Site URL: https://prforgd.com
- Tables: workout_results, favorites, user_equipment (all with RLS)
- Auth: Google OAuth + Apple Sign In + email/password
- Shared database with other apps — tables separate, RLS per user

## Apple Sign In Config
- Team ID: N27NV97893
- App ID: com.prforgd.app
- Services ID: com.prforgd.web (used as Client ID in Supabase)
- Key ID: P28CXR59H2
- .p8 key file: AuthKey_P28CXR59H2.p8
- JWT secret expires every 6 months — regenerate with scripts/generate-apple-secret.js
- Apple Developer return URL: https://uqtlqprxepcpajvrxies.supabase.co/auth/v1/callback
- Apple Developer domain: uqtlqprxepcpajvrxies.supabase.co

## Theme / Colors
- Deep navy background: #001228
- Bright green primary: #7FFF3B
- Card: #003259, Card border: #004470
- Text: #FFFFFF, Secondary: #8AAFC4, Muted: #4D7A94
- Tab bar: Ionicons, green active, muted inactive
- Branch colors: army=#4B5320, navy=#000080, marines=#CC0000, air-force=#00308F, firefighter=#FF4500, leo=#003366, benchmark=#8B4513
- All page titles: centered, green, 24px, 900 weight
- All subtitles: white (colors.text)
- Filter chip dividers: light blue (colors.textSecondary)

## Key Design Decisions
- Tab order: WODs, Create, Log, Gear, Moves, Me
- Two flows from WOD detail: START (live timer) and LOG (manual entry with date)
- Rx toggle only — no completed/DNF. Rx = full workout as prescribed. Scaled = not Rx.
- PR detection: auto-compares Rx results only
- Button colors: START=green, PAUSE=yellow, STOP=red, RESUME=blue, RESET=orange, SAVE=solid green
- Videos play inline via YouTube embed modal
- WOD generator only uses movements with videos + matching user equipment
- Filter labels: "Favs" and "My Gear" (not all caps)
- Log page filters: ALL, PRs, Rx, Scaled
- Export on Log page with download icon (not on WODs page)
- App icon image in top right of WODs page
- Always sort WODs A-Z (no sort toggle)
- Sync = merge (union favorites, combine results by ID local wins, equipment local wins)

## Known Issues / Gotchas
- FlatList doesn't render on web — use ScrollView with .map()
- Platform.OS returns 'web' on phone PWA — use screen width (isDesktop = width > 768) for mobile detection
- Alert.alert doesn't work on web — use Toast component (src/components/Toast.tsx)
- Vercel ignores node_modules paths — fonts MUST be flattened by post-export script
- expo install needed for compatible versions (not npm install)
- Some npm installs need --legacy-peer-deps
- OAuth: root _layout.tsx parses URL hash tokens after Google redirect
- Safe area: env(safe-area-inset-bottom) + viewport-fit=cover for iPhone tab bar
- paddingTop: spacing.md on all screens; iPhone PWA safe area handled by CSS env(safe-area-inset-top) on #root in post-export.js
- Phone Safari vs Chrome have different safe areas — CSS env() handles both

---

## deploy (deploy.md)

# PRForgd Deploy Process

## Full Deploy Command
```bash
cd prforgd
rm -rf dist
npx expo export --platform web
node scripts/post-export.js
cp public/manifest.json dist/
cp public/icon-192.png dist/
cp public/icon-512.png dist/
cp public/favicon.ico dist/
cp vercel.json dist/
cp -r api dist/
# NOTE: api-package.json no longer exists — api/ now carries its own package.json
# (copied in via `cp -r api dist/`), so no separate dist/package.json step is needed.
rm -rf dist/.vercel
vercel link --cwd dist/ --yes --project prforgd
vercel deploy dist/ --prod --yes
git add -A && git commit -m "message" && git push
```

## What post-export.js does
1. Injects PWA meta tags (apple-mobile-web-app, manifest link, apple-touch-icon)
2. Injects safe-area CSS (env safe-area-inset-top on #root, env safe-area-inset-bottom for tab bar)
3. Adds viewport-fit=cover to viewport meta tag
4. Flattens font files from node_modules path to assets/fonts/ (Vercel ignores node_modules)
5. Rewrites JS bundle font paths to match flattened location
6. Removes old deep node_modules font path

## Important Notes
- Vercel ignores files under node_modules/ paths — fonts MUST be flattened
- vercel.json has rewrites for SPA routing (excludes _expo, assets, static files)
- Always rm -rf dist/.vercel before vercel link to avoid linking to wrong project
- Must link to project "prforgd" specifically
- Copy vercel.json into dist/ before deploying

## Vercel Project
- Project: pat-9343s-projects/prforgd
- Production URL: https://www.prforgd.com

## GitHub
- Repo: cw0rley/prforgd (private)
- Branch: main

---

## back-arrow-centering (feedback)

**How the header back-arrow chevron is centered, and to MEASURE not eyeball it.**

The header back button (`Ionicons name="chevron-back" size={32}`) in the `headerLeft` of every Stack screen (wod, log, privacy, paywall, leaderboard, help, export) is an icon-font glyph whose font baseline renders it LOW and slightly off horizontally inside its touch target / iOS Button-Shapes oval. It must be nudged with a transform.

**Do NOT eyeball this** — the user asked 4 times because each guess (translateX -4, translateY -1/-2) was ~9× too small. Measure instead.

Calibrated values (fontSize 32, paddingHorizontal 12 / paddingVertical 10, `lineHeight: 32`):
`style={{ lineHeight: 32, transform: [{ translateX: 1 }, { translateY: -9 }] }}`

The `headerRight` favorite **star** in `wod/[id].tsx` (`size={28}`, no lineHeight) had the SAME low-glyph issue: measured dX=0 (already h-centered), dY=+19px low → `style={{ transform: [{ translateY: -8 }] }}`. Note the star needs a DIFFERENT translateY (-8) than the chevron (-9) because different icon size + no lineHeight → different font-metric offset. Always measure each icon separately.

**How they were derived (repeat this if it ever drifts):** take a device screenshot, then use PowerShell + System.Drawing to measure pixel bounding boxes:
- Chevron = green pixels (`G>100 && G>R+30`); oval fill = `R>=9 && G<90 && B>20`.
- Compute each center; the chevron center should equal the oval center.
- Convert the pixel delta to RN points via `px_per_pt = ovalHeightPx / 52` (52 = 2*10 padding + 32 lineHeight), then adjust the existing translate by that many points.
- Measured offset in build 27: chevron was dX=-12px, dY=+17px vs oval → +12px right (≈+4.8pt) and +17px up (≈+6.75pt) → translateX -4→+1, translateY -2→-9.

Gotcha: the user's macOS screenshots live in `G:\My Drive\_Transfer\` with a **narrow no-break space (U+202F)** before "PM" in the filename — plain `-LiteralPath` fails; resolve with a wildcard (`Screenshot ... at 8.33*.png`). Google Drive's virtual FS also blocks `Image.FromFile` on the live path — copy to `$env:TEMP` first.

---

## cut-paste-as-files (feedback)

**Always write copy/paste-intended text to a file in cut-paste/ instead of printing it in the CLI.**

When giving the user text meant to be copied and pasted elsewhere (commit messages, review replies, release notes, form answers, config snippets, etc.), write it to a `.txt` file in `C:\Users\pat\Documents\Claude\Projects\Workout\cut-paste\` instead of printing it inline in the CLI. Then tell the user the file path.

**Why:** When pasted from the CLI, the text picks up extra spaces and characters (terminal wrapping/formatting) that don't paste correctly.

**How to apply:** Create/overwrite a clearly named `.txt` file under `cut-paste/`, put the raw paste-ready text in it, and reference the path. Use plain text with no terminal-only formatting. Release notes follow the existing `whats-new-<version>.txt` naming.

**Canonical folder:** the PROJECT-ROOT `cut-paste\` (holds the full history). There is a decoy `prforgd\cut-paste\` — do NOT use it; the root folder is the one to write to.

---

## workspace-docs-location (feedback)

**Where the user looks for reference docs — project-root docs/, not the app's prforgd/docs/.**

Reference/how-to docs the USER reads go in the **project-root `docs/`** folder:
`C:\Users\pat\Documents\Claude\Projects\Workout\docs\`.

**Why:** The workspace root (`Workout/`) holds the user-facing folders — `docs/`, `cut-paste/`, `img/`, `videos/`, `data/` — alongside the app folder `prforgd/`. The app has its OWN `prforgd/docs/` for developer/release notes that live in the git repo. On 2026-07-29 I wrote `adding-workouts.md` only into `prforgd/docs/` and the user couldn't find it — they were looking in `Workout\docs`.

**How to apply:** When creating a doc for the user to read/reference, write it to `Workout\docs\` (project root). Put it in `prforgd\docs\` too only if it should be committed with the app.

---

## supabase-auth-getuser-lock (feedback)

**Never use supabase.auth.getUser() in hot paths — it holds the auth lock and hangs getSession() for ~30s.**

**Use `supabase.auth.getSession()` (local read), NOT `supabase.auth.getUser()` (network), to get the current user in app code.**

**Why:** supabase-js serializes auth operations behind an internal lock (Web Locks on web). `getUser()` makes a network round-trip to validate the token *while holding that lock*. If the network stalls, every other `getSession()` call queues behind it for ~30s. The app resolves the per-user storage namespace via `getSession()` (localStore `getNamespace`/`getUserId`) and the landing gate detects login via `getSession()` — so a single hanging `getUser()` cascades into: (1) ~30s delay before the app appears after login, and (2) favs/gear writes landing in the anon namespace instead of the account (so they don't save/sync).

**How to apply:** In storage/UI code that just needs the user id, do `const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;`. Reserve `getUser()` for the rare case you must server-validate the token. Regression introduced 2026-07-29 in `src/storage/profileStorage.ts` (leaderboard Phase 1) and fixed same day.

The hard gate in landing-page was also hardened to treat a persisted `sb-*-auth-token` as logged-in on every render so it can't stick after login.

---

## otp-length-gotcha (project)

**Signup breaks if Supabase Email OTP Length isn't 6 — the app hard-locks to 6 digits.**

The app's email-confirmation flow is hard-coded to a **6-digit** code (`prforgd/app/(tabs)/profile.tsx` — `maxLength={6}`, `slice(0, 6)`, rejects `length < 6`; copy says "6-digit code"). There is no variable-length fallback.

So signup silently breaks if Supabase's **Email OTP Length** setting is anything other than 6: the email sends an 8-digit code, the app's input only fits 6, and the new user gets stuck at the verify step.

Happened once (2026-07-27): a user reported "app said 6-digit code but the email had 8 digits." Root cause was the new Supabase project (`boyjkzbouqqvhnggcgun`) having **Email OTP Length = 8**. Fixed by setting it back to 6 in the dashboard (no code change / no rebuild). User then registered successfully.

**Fix location:** Supabase dashboard → Authentication → Sign In / Providers → Email → **Email OTP Length → 6**.

**Why it drifted:** the migration guide (`prforgd/docs/supabase-migration.md`) never pins this setting, so a fresh/migrated project can default or get set to something else.

**How to avoid recurrence (pick one):**
1. Add "set Email OTP Length = 6" to the migration guide's Auth-config step, OR
2. Harden the app to accept a variable-length code (6–10 digits) — user declined this for now.

---

## eas-build-windows-gotchas (project)

**EAS production builds from this Windows machine require requireCommit + clean dep tree.**

Two gotchas that broke the first PRForgd build 9 attempt (2026-06-15), both fixed in eas.json/package.json:

1. **Windows upload permissions** — Without `cli.requireCommit: true` in eas.json, eas-cli tars the Windows working copy and uploads directories with 000 permissions. EAS workers then fail to extract: Android dies with `tar: Cannot mkdir: Permission denied`, iOS with `EACCES ... mkdir '.expo/web'` during icon generation. Fix: `requireCommit: true` forces a clean git-archive upload (correct POSIX perms). Tree must be committed before building. Also disabled `autoIncrement` (production profile) so versions come from committed app.json deterministically.

2. **expo-audio peer dep** — `expo-audio@1.1.1` (correct for SDK 54) has peer `expo-asset: "*"`, so npm pulled in `expo-asset@56` / `expo-constants@56` / `expo-font@55` (newer-SDK native code) as duplicates that break prebuild. Fix: add `expo-asset` and `expo-font` as DIRECT deps at SDK-54 versions (`npx expo install expo-asset expo-font`) so they dedupe. Verify with `npm ls expo-asset expo-constants expo-font` — must show only ~12 / ~18 / ~14.

**To read EAS build logs without a browser:** `npx eas-cli build:view <id> --json` includes a `logFiles[]` signed URL; `curl --compressed` it (it's newline-delimited JSON, parse the `msg` field per line).

iOS build from a26f287 verified FINISHED (.ipa produced), confirming both fixes work.

---

## play-service-account (project)

**Google Play service-account key for EAS auto-submit is now set up (was previously blocked).**

Resolved 2026-06-15: EAS auto-submit to Google Play now works (previously blocked — no service-account key).

- Service account: `eas-play-submit@prforgd-play.iam.gserviceaccount.com` (Google Cloud project `prforgd-play`, Google Play Android Developer API enabled).
- Key file: `prforgd/google-service-account.json` — **gitignored, never committed**. If it goes missing, regenerate from Google Cloud Console → IAM → Service Accounts → Keys → Add key (JSON).
- Granted access via Play Console → **Users and permissions → Invite user** (Admin/all permissions). NOTE: this account's Play Console has **NO "API access" page** in the nav, so the Users-and-permissions invite is the working method.
- eas.json: `submit.production.android` → `serviceAccountKeyPath: ./google-service-account.json`. (Track later changed internal → production once Google granted prod access.)
- Verified: `eas submit -p android --latest --non-interactive` succeeded.

---

## web-login-divergence (project)

**Web login redesign (centered card) — SHIPPED to prforgd.com 2026-06-10.**

**SHIPPED (2026-06-10): deployed to Vercel prod (prforgd.com) and pushed to GitHub (commit a11d663).** The web login is a centered max-width (420px) card via an early-return `Platform.OS === 'web'` branch in `prforgd/app/(tabs)/profile.tsx`, with a separate `web` StyleSheet. Native layout untouched (falls through to original JSX).

Design (user-chosen): card header row = 72px brand logo (`brand-kit/png/icon-256.png`) left of stacked "Welcome back"/subtitle text; underline-style SIGN IN/SIGN UP tabs; green focus borders on inputs; hover states via local `HoverButton` (Pressable `hovered` state); Enter-to-submit; Google+Apple side-by-side with Ionicons glyphs.

Note: this change is web-only (early return), so it does NOT need to ride in the iOS 1.0.1 build — nothing native changed.

---

## build-9-followups (project)

**Deferred fixes to roll into iOS build 9 (after build 8 ships) — sync RLS collision + show-password toggle.**

Decided 2026-06-12: ship build 8 (account-deletion fix) to App Store NOW; defer these two fixes to a later build 9.

>>> GATE NOW CLEAR (2026-06-15): iOS build 8 (v1.0.1) is APPROVED and LIVE in the App Store, and both migrations are live. Next action = submit build 9 (v1.0.2) with sync rework + show-password. Bump version/build, EAS build iOS+Android, TEST SYNC ON A PHYSICAL DEVICE first (realtime + AsyncStorage), then submit.

STATUS 2026-06-12: ALL THREE code-complete (typechecks clean), web DEPLOYED. #3 web Me screen DONE (centered web.signedInColumn). #2 show-password DONE (eye toggle on both web + native password fields in profile.tsx, showPassword state). Both Supabase migrations now LIVE (user ran composite-pk + updated-at).

TESTED & VALIDATED on localhost web 2026-06-12: anon→account merge (no RLS error), per-user isolation (logout empties log), delete propagation (deleted_at soft-delete), cross-device. Fixes added during testing: (a) reconcileResults re-reads tombstones before writing local; (b) anon delete-tombstones merged on login; (c) `onSynced` pub-sub in sync.ts + History/index screens reload on it; (d) web OAuth redirect fixed to origin+'/profile'.

#1 expanded into a FULL SYNC REWRITE (user chose Phase 1+2 "make it bulletproof"). Architecture now:
- **Per-user local storage**: AsyncStorage keys namespaced `<base>:<userId>` (or `:anon` logged out) via new `src/lib/localStore.ts`. One-shot `migrateLegacyStorage()` moves old global keys on app boot (_layout.tsx). `mergeAnonIntoUser()` folds logged-out data in on login.
- **Single reconciler** `syncNow()` in rewritten `src/lib/sync.ts` (push+pull+merge, single-flight + rerun coalescing). `requestSync()` = debounced fire-and-forget called by every mutation. Old per-event cloud fns REMOVED.
- **Triggers**: login (merge+sync via handleSession in profile.tsx), app foreground (AppState in _layout), every log/edit/delete (storage modules markDirty+requestSync), logout (flush via syncNow then clear session), realtime (subscribeRealtime in _layout).
- **Retry**: per-ns `sync_dirty` flag; failed syncs leave it set, next trigger retries.
- **Phase 2 LWW**: workout_results.updated_at drives last-write-wins; local WorkoutResult has `updatedAt`. Favorites use tombstones (favorite_wods_deleted). Equipment LWW by updated_at.

TWO SQL MIGRATIONS must be live in Supabase BEFORE deploying this code — BOTH NOW LIVE (confirmed 2026-06-15):
  1. `prforgd/scripts/workout-results-composite-pk.sql` — ran 2026-06-12.
  2. `prforgd/scripts/workout-results-updated-at.sql` — ran by 2026-06-15 (adds updated_at + realtime publication).

NEW FEATURE FOR BUILD 9 (added 2026-06-15): AMRAP countdown timer + 3-2-1-GO lead-in for ALL timer workouts, with sound. Implemented entirely in `app/log/[id].tsx`. Added native dep `expo-audio` (playback only; app.json plugin set `microphonePermission:false` so NO new permissions). Sound assets synthesized by `scripts/generate-timer-sounds.js` → `assets/sounds/{beep,go,buzzer}.wav`.

BUILD 12 was current at the time (2026-06-15, v1.0.2 buildNumber 12 / versionCode 7). Adds Rx-badge removal from timer/log start screen + email-confirm redirect fix.

The two original deferred fixes:
1. **workout_results sync RLS collision.** Sync upload used `upsert(..., { onConflict: 'id' })`. Local workout ids can already exist in the cloud owned by a different user_id → RLS error. Fix: make table multi-tenant — composite PK `(user_id, id)`, change upserts to `onConflict: 'user_id,id'`.
2. **Show-password toggle on signup.** Add eye icon that flips `secureTextEntry`.
3. **Web Me/profile screen not styled for desktop.** Give the signed-in profile view the same centered/max-width web treatment as the login card.

---

## email-confirm-native-followup (project)

**Known flaky email-signup confirmation on native; fix as a fast-follow (not blocking).**

Reported 2026-06-15 (son tested on phone): email/password signup confirmation link was flaky on the native app — first tap "didn't redirect," a retry worked. Not blocking (succeeds on retry; Google/Apple sign-in don't use email confirmation).

**Cause:** `src/lib/auth.ts` `signUp` passes no `emailRedirectTo`, and `src/lib/supabase.ts` sets `detectSessionInUrl: false`. A native signup's confirm link redirects to the Supabase **Site URL** with no clean path back into the app → flaky landing.

**Fix (later superseded by the OTP approach — see coupons-and-email-otp):**
- Pass `emailRedirectTo` in `signUp`: web → `https://www.prforgd.com`, native → point at the web confirm page or a `prforgd://auth/callback` deep link.
- Verify Supabase Auth → URL Configuration: Site URL = `https://www.prforgd.com`; redirect allowlist includes `https://www.prforgd.com/**`, `https://prforgd.com/**`, and `prforgd://auth/callback`.
- Consider custom SMTP (Resend) for Auth emails for deliverability.

---

## coupons-and-email-otp (project)

**Coupon free-workout codes + email OTP confirmation — code done, two manual Supabase steps gate go-live (now done).**

Built 2026-06-17 (web + native code, typechecks clean). Two features:

**1. Email confirmation → 6-digit OTP** (replaces flaky native magic-link). `src/lib/auth.ts` (verifyEmailOtp/resendSignupOtp, signUp no longer sets emailRedirectTo); verify step UI in `app/(tabs)/profile.tsx` (web + native). See `prforgd/docs/email-otp.md`.

**2. Coupons = +N free workouts**, reusable campaign codes (cap + expiry, once per user). `scripts/coupons.sql` (coupons + coupon_redemptions tables + redeem_coupon RPC); `src/lib/subscription.ts` (redeemCoupon/refreshCouponBonus/getCouponBonus; effective free limit = FREE_LIMIT(10) + bonus); `src/components/CouponRedeem.tsx` shown on paywall + profile. See `prforgd/docs/coupons.md`.

SUPABASE MANUAL STEPS — ALL DONE 2026-06-17 (project boyjkzbouqqvhnggcgun): coupons.sql run; Confirm-signup template updated with {{ .Token }} (branded HTML from cut-paste/confirm-signup-email.html); first coupon code created. Backend is LIVE.

Coupon enforcement is honor-system-ish (local results.length vs limit), same as base free tier.

---

## sync-data-loss-fix (project)

**Root cause + fix for workouts silently disappearing — save/sync read-modify-write race.**

**Symptom (recurring, intermittent):** a just-logged workout vanishes and never reaches the cloud. Confirmed 2026-06-17: user did "The Don" (wod_id `the-don`) on 06-16, saved it, gone — zero rows in Supabase. That lost log is unrecoverable.

**Root cause:** `saveResult`/`deleteResult` (workoutStorage.ts) and the sync reconciler (`reconcileResults` in sync.ts) both did UNLOCKED read-modify-write on the whole workouts array. A foreground/realtime sync snapshots local, spends ~seconds on network I/O, then writes its merged set back. A save landing during that window is overwritten by the stale merged write. The reconciler had a re-read guard for *deletes* but NOT for *additions*.

**Fix (commits 4f86170 + fd2c1fe, on main, web deployed 2026-06-17):**
- `localStore.ts` — added per-key async mutex `withLock(key, fn)`.
- `workoutStorage.ts` — `saveResult`/`deleteResult` wrap their RMW in `withLock(KEYS.results, …)`; saveResult also dedupes by id and calls `pushNow`.
- `sync.ts` — reconciler's final write runs inside `withLock`, re-reads fresh local + tombstones right before writing, folds in any workout added/edited during the network window, and pushes those late rows. Plus `pushResultNow` = immediate single-row cloud upsert on save (defense in depth).

**Proof:** added Jest (`npm test`); `src/lib/__tests__/sync-race.test.ts` reproduces the race. VERIFIED the tests go RED when the fix is reverted.

**On-device verified 2026-06-17:** user installed build 14 on iPhone and logged Bowen — confirmed in Supabase. The fix sticks on-device.

**Android production submitted 2026-06-23:** Google granted production access. vc9/1.0.3 confirmed IN REVIEW 2026-06-24 (Submission 5). LESSON: when promoting to prod, the AAB is usually already on Play from the internal/testing submit — skip rebuild+resubmit, just "Add from library" the existing versionCode in the Console. LESSON (stale UI): the Play **Publishing overview** "running quick checks" banner does NOT auto-refresh; source of truth is **Test and release → Submission activity → Submission N**.

NOTE: EAS Submit is FREE (no build credit); only `eas build` costs credits.

---

## user-preferences-sync (project)

**Per-user synced UI preferences (WODs Favs/My Gear filter toggles) + pending Supabase migration.**

The WODs-screen **Favs** and **My Gear** filter toggles are saved per-user, not device-global (fixed 2026-07-29 — they were plain global `AsyncStorage` keys `ui_filter_favorites`/`ui_filter_equipment`, which bled a logged-in user's ON state into the logged-out view and stranded them on an empty "0 WODs" list).

Now handled by `prforgd/src/lib/uiPrefs.ts`: a per-user **namespaced** local cache (`ui_filter_prefs` via `localStore` readJSON/writeJSON) for instant/offline reads, plus best-effort **cloud sync** to a new `public.user_preferences` table (`user_id` PK, `prefs jsonb`). Wired into `app/(tabs)/index.tsx` (restore on mount + `pullFilterPrefs` on sync; `setFilterPrefs` on toggle). Cloud calls are try/catch — local still works if offline or the table is missing.

**PENDING MANUAL STEP:** run `prforgd/scripts/create-user-preferences-table.sql` in the Supabase SQL Editor to enable cross-device sync. Until then filter prefs are local-per-user only. (Per the 2026-07-30 status, this migration was RUN.) Confirm with user.

---

## landing-page (project)

**Web-only marketing landing page (LandingGate) that gates the app for logged-out visitors.**

prforgd.com shows a marketing "front page" to logged-out **web** visitors before the app: `prforgd/src/components/LandingGate.tsx`, mounted as an overlay in `prforgd/app/_layout.tsx`.

**Product decisions:**
- **HARD gate (changed 2026-07-29)** — logged-out web visitors ALWAYS see the landing and CANNOT browse the app. Reverses the original 2026-07-27 soft-gate at user request. Only routes reachable while logged out: `/profile` (login) + `/privacy` + `/help` (the `PUBLIC_ROUTES` allow-list). Gate visibility = `Platform.OS === 'web' && !session && !PUBLIC_ROUTES.includes(pathname)` — reactive to `usePathname()` + `onAuthStateChange`. The "Explore the app" button was REMOVED; hero secondary button is now "Sign in →".
- **Anti-flash login handling (2026-07-29):** "logged in" is a STICKY `authed` state seeded synchronously from `hasAuthToken()` (localStorage `sb-*-auth-token`, incl. chunked `.0`), only cleared by an explicit `SIGNED_OUT` event. ALSO seeded from `hasOAuthCallback()` = `window.location.hash` contains `access_token` (Google OAuth redirects back to the ROOT route with tokens in the hash BEFORE `_layout` calls setSession).
- **Web only** — never shown on native or to signed-in users.
- **In-app screen**, not a standalone static page — reuses the Expo bundle and deploy pipeline. Standalone SEO page is a possible future project.

Sections: hero + faux phone mockup → stats → how-it-works → features → FAQ → CTA → footer. All copy lives in editable arrays at the top of the file. Testimonials were built then **removed** at user request (fake reviews risk policy issues).

Brand wordmark for the landing/white-card use lives at `prforgd/brand-kit/wordmark.svg` (+ rendered `wordmark.png`, 1200x480, transparent) — matches the `header-800` lockup.

Shipped to web production 2026-07-27 (Vercel). Native builds untouched.

---

## leaderboard-feature (project)

**Leaderboard feature spec and product decisions — FEATURE COMPLETE (Rx-only).**

The next big feature after the App Store fixes (decided 2026-06-08): a leaderboard where users submit their workout times.

Product decisions made by the user:
- **Scope:** Global with filters (build global first, layer gym/region filters later).
- **Eligible WODs:** All standard/built-in WODs each get a board; exclude user custom WODs.
- **Verification:** Honor system (add flag/report + admin moderation later; no video proof).
- **Divisions:** Rx ONLY (Scaled excluded) × Male/Female × Age groups. (Refined 2026-07-29: user dropped Scaled boards.)
- **Identity:** public **username** set once in profile (required before submitting).
- **Age brackets (2026-07-29):** Open 16–34, Masters 35–39 / 40–44 / 45–49 / 50–54 / 55–59 / 60+.

Build status:
- **Phase 1 SHIPPED 2026-07-29** (web). Migration `prforgd/scripts/create-profiles-table.sql` RUN (project boyjkzbouqqvhnggcgun). Files: `src/storage/profileStorage.ts`, `src/components/AthleteProfile.tsx`, wired into signed-in `app/(tabs)/profile.tsx`. Username uniqueness = DB unique index on lower(username), friendly error on 23505. `profiles` table owner-only RLS at first.
- **Phase 2 SHIPPED 2026-07-29.** Migration `add-is-public-column.sql` RUN (`workout_results.is_public bool default false` + partial index). `WorkoutResult.isPublic`; `setResultPublic(id, bool)` in workoutStorage; sync toRow/fromRow carry `is_public`. UI: gold "LEADERBOARD"/"ON BOARD" toggle on **Rx** results in the Log expanded actions (`app/(tabs)/history.tsx`), requires a profile before submitting. NOTE: toRow always writes is_public now, so the column MUST exist or all sync breaks.
- **Phase 3 + 4 SHIPPED 2026-07-29. FEATURE COMPLETE.**
  - Phase 3: migration `create-leaderboard-view.sql` RUN — a **security-definer view** `public.leaderboard_entries` (owned by postgres, bypasses base-table RLS) exposing ONLY username, sex, computed age_division (hides exact year), wod_id, time_seconds/rounds/reps, date, for `is_public=true and deleted_at is null and rx=true` rows. `grant select ... to anon, authenticated`. Helper `src/storage/leaderboardStorage.ts` `getLeaderboard(wodId, {sex, ageDivision})` dedupes to each username's best + ranks (time asc / rounds+reps desc).
  - Phase 4: screen `app/leaderboard/[id].tsx` (Sex All/M/F × age-division chips, ranked rows). Reached via a "VIEW LEADERBOARD" gold button on `app/wod/[id].tsx`.
  - Age divisions computed dynamically from `now()` in the view.
  - Backlog: gym/region filters, report/moderation tooling, maybe surfacing the leaderboard publicly on the marketing page.

Also shipped same session (2026-07-29): **share-a-result** feature (`src/lib/share.ts`; SHARE buttons in Log entries + post-workout). And favorites fix: Log star now WOD-level/synced; favorite star added to `app/wod/[id].tsx` header.

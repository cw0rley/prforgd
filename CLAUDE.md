# PRForgd

CrossFit workout logging app. Expo / React Native, shipping to iOS, Android and web.

## Where things are

This repo sits inside a project workspace that also holds non-code material:

```
C:\Code\personal\prforgd\
├── prforgd\        THIS REPO — the app
├── .claude-app\    social content: weekly drafts, graphics, TikTok videos
├── cut-paste\      store listings, release notes, review replies
├── docs\           workout docs, all-workouts.md, migration keys
├── img\
└── videos\         CrossFit movement CSVs and scraper scripts
```

A scheduled task writes weekly social drafts into `.claude-app\social\weekly-drafts\`.

## Stack

- **Expo 54** with **expo-router** (file-based routing, `app/`)
- **React Native 0.81**, React 19
- **Supabase** — auth, database, leaderboard
- **Stripe** — subscriptions, via serverless functions in `api/`
- **Vercel** — web deploy; `vercel.json` rewrites everything to `index.html`
- **EAS** — iOS and Android builds, `requireCommit: true`
- TypeScript, Jest (`npm test` runs `jest --forceExit`)

## Layout

```
app/            expo-router screens: (tabs), log, wod, leaderboard,
                paywall, export, help, privacy
src/
  components/   shared UI
  data/         workout definitions
  hooks/
  lib/          supabase client, helpers
  storage/      local persistence
  theme.ts      dark theme, background #001228
api/            Vercel serverless: stripe-webhook, welcome-email,
                delete-account
scripts/        Supabase SQL migrations + one-off node scripts
docs/           user manual, store listing, supabase migration notes
```

## Identifiers

- Bundle ID: `com.prforgd.app` (iOS and Android)
- App Store Connect: `6774586516`, Apple Team `N27NV97893`
- Apple ID for submissions: `prcunningham@gmail.com`
- Current app version: **1.0.6**, iOS build 29

## Commands

```bash
npm start          # expo start
npm run ios
npm run android
npm run web
npm test           # jest --forceExit
```

## Release

1. Bump `version` in `app.json` (and `buildNumber` for iOS)
2. Commit — EAS has `requireCommit: true` and will refuse a dirty tree
3. `eas build --profile production`
4. `eas submit --profile production`
5. Write release notes into `cut-paste\whats-new-<version>.txt`
6. Web deploys via Vercel

## Database

Schema changes are SQL files in `scripts/`. Apply them in Supabase; there is no
migration runner. `docs/supabase-migration.md` has the notes.

Tables include profiles, workouts, subscriptions, user preferences, coupons, and
a leaderboard view. Some scripts are one-off fixes rather than schema — read
before running.

## Things that are not in git

- `.env.local` — Supabase and Stripe keys
- `google-service-account.json` — at repo root, gitignored

Both are backed up encrypted in `G:\My Drive\_Code\_Assets\secrets-*.zip`.
If you need them and don't have them, they can be regenerated from the Supabase,
Stripe and Google Cloud dashboards.

## Conventions

- Dark UI throughout; theme in `src/theme.ts`, background `#001228`
- Serverless functions in `api/` are plain JS, not TypeScript
- Workout data lives in `src/data/` and `docs/all-workouts.md`

## History note

This project used to live at `C:\Users\pat\Documents\Claude\Projects\Workout`.
Claude Code sessions from before Aug 2026 are filed under that old path in
`~/.claude/projects/` and still appear in `claude --resume` under the old
directory name.

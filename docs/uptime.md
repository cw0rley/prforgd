# Uptime monitoring

## Why this exists

On 2026-09-21 a Vercel git-sourced deploy published the bare repo (no build
command, no `index.html`) and seized the production domain. prforgd.com returned
404 for **two days** before anyone noticed. Git auto-deploy is now disabled, but
the real gap was that nothing was watching.

## What's in place

`.github/workflows/uptime.yml` — a GitHub Actions job that runs **hourly** and
fails if prforgd.com is not serving the app. A failed run emails the repo owner
(GitHub does this by default for scheduled workflows on your own repos).

It checks two things, not one:

1. HTTP 200
2. the page actually contains `<title>PRForgd</title>`

The second check matters. The Sept outage came from a deployment that was
`READY` and returned valid responses — it just had no app in it. A naive
status-only check can pass while the site is useless.

It retries three times with a 20s gap so a transient blip doesn't send mail.

Run it on demand:

```bash
gh workflow run uptime.yml
```

### Why hourly and not every 5 minutes

This is a **private** repo, so Actions minutes are metered and each run bills a
full minute even though the check takes seconds. Hourly is ~720 min/month,
inside the 2000-minute free tier. Every 5 minutes would be ~8600 and blow
through it.

Two other GitHub caveats worth knowing:

- Scheduled workflows are queued on a best-effort basis and can be delayed
  during peak load, so treat the cadence as approximate.
- GitHub disables scheduled workflows after **60 days of repo inactivity**. If
  the project goes quiet, this silently stops running.

## Recommended: add an external monitor too

Those caveats are exactly why the Actions job should not be the only safeguard.
A dedicated uptime service checks every 1-5 minutes from outside GitHub, and can
alert by SMS or push rather than email.

Free tiers that suit this project: **UptimeRobot**, **Better Stack**, or
**Cron-job.org**.

Set it up with:

- URL: `https://prforgd.com`
- Interval: 5 minutes
- Alert on: status != 200
- If the service supports keyword monitoring, also require the keyword
  `PRForgd` — same reasoning as above.

This needs an account, so it has to be created by hand; it takes a couple of
minutes.

## Also worth checking after any web deploy

A `READY` deployment does not mean a working site. Verify the real domain:

```bash
curl -sL -o /dev/null -w "%{http_code}\n" https://prforgd.com
curl -sL https://prforgd.com | grep -o "<title>[^<]*</title>"
```

Do **not** test the `*.vercel.app` URL — SSO protection makes it return 200 with
a Vercel login page even when the deploy is broken. Custom domains are exempt.

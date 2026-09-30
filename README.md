# cyborg. · go-live

Single-user operating system for Caleb Vears · Earthed High Voltage + Earthed Energy. Static front end (`index.html`) + Vercel serverless functions (`api/`) + Vercel KV for persistence. No build step.

## 0 · What's in the box

```
index.html          the whole dashboard (one file)
support.js          runtime the dashboard needs · do not edit
api/                33 serverless functions · crons, webhooks, Arc, KV store
data/               seed JSON · first-run content · KV takes over after first write
assets/             logos, icon, background
manifest.json sw.js PWA · install on phone, offline shell, push
vercel.json         cron schedule + headers
.env.example        every env var with what it does
```

## 1 · GitHub (5 min)

1. github.com → New repository → `cyborg-os` → **Private** → Create.
2. On your Mac, in this unzipped folder:
   ```
   git init
   git add .
   git commit -m "cyborg. v1 · go-live"
   git branch -M main
   git remote add origin https://github.com/<you>/cyborg-os.git
   git push -u origin main
   ```
   `.gitignore` already excludes `.env`, `node_modules`, `data/state.json`.

## 2 · Vercel (5 min)

1. vercel.com → Add New → Project → Import `cyborg-os`.
2. Framework preset **Other**. Root directory **./**. Build command **empty**. Output directory **empty**. Deploy.
3. It will load but be locked and offline-ish until step 3. That's expected.

## 3 · Storage + the three required keys (10 min)

1. Vercel → your project → **Storage** → Create Database → **KV** (or Upstash Redis via Marketplace, same REST API). Connect to project. This injects `KV_REST_API_URL` + `KV_REST_API_TOKEN` automatically — check under Settings → Environment Variables.
2. Settings → Environment Variables → add:
   - `DASHBOARD_PASSCODE` — your lock code
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
3. Deployments → ⋯ on the latest → **Redeploy** (env vars only apply on a fresh deploy).
4. Open the URL. Unlock. Settings page → Go-live checklist should show **Arc live**, **Persistence** and **Passcode** ticked. Dashboard → Arc status reads `Live · claude-sonnet-4-5`.

Test Arc: type *"what bills are due this fortnight"* then *"add a note: test from go-live"*. The second one should show `USED · add_note` under the reply and appear on Brain.

## 4 · Phone (2 min)

Safari → your Vercel URL → Share → **Add to Home Screen**. Opens full-screen, works offline for reads, syncs when back.
Then Settings → This device → **Enable push** (only works after VAPID keys, step 5).

## 5 · Optional connectors · switch on in any order

Each connector card on Settings lists its exact env names and links to where to get them. After adding any key: **Redeploy**.

| Want | Add | Then |
|---|---|---|
| Event + digest emails | `RESEND_API_KEY`, `DIGEST_EMAIL` | Verify `earthedhv.au` in Resend → Domains first, or emails bounce |
| SMS reminders | `TWILIO_*`, `REMINDER_TO` | Daily 07:00 ACST cron sends due bills |
| Phone push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Tap Enable push on the phone |
| Calendar in Apple/Google | nothing | Subscribe to `https://<url>/api/calendar-ics` |
| Meta lead ads → CRM | `META_*` | Meta App → Webhooks → Page → `leadgen` → URL `https://<url>/api/meta-lead-webhook`, verify token = your `META_VERIFY_TOKEN` |
| Xero income + bill matching | `XERO_*` | Reconnect at developer.xero.com (token expired Aug) |
| Bank balances | `BASIQ_*` | Basiq consent flow links NAB + Macquarie |
| OneDrive vault | `MS_GRAPH_TOKEN`, `ONEDRIVE_FOLDER_ID` | Azure app registration · Files.Read |

## 6 · Crons (already scheduled in vercel.json · UTC)

| Path | When (ACST) | Does |
|---|---|---|
| `/api/event-reminder` | every 15 min | sends due calendar reminders via Resend |
| `/api/reminders-send` | 07:00 daily | bill reminders · SMS + push |
| `/api/xero-sync` `/api/bank-feed` `/api/xero-match` | 05:30–05:45 daily | live finance feeds |
| `/api/weekly-digest` | Sun 18:00 | digest · email + SMS |
| `/api/finance-sync` | Mon 07:30 | bills register refresh |

Hobby plan allows daily crons only — the 15-min event reminder needs **Pro**, or change its schedule to `0 21 * * *` (06:30 ACST) and reminders send the morning of.

## 7 · Day-to-day

- **⌘K / Ctrl+K** — jump anywhere, find any lead / bill / event / doc / note, or hand a question to Arc.
- **Bell** (sidebar) — notifications: new leads, reminders sent, docs expiring, digests, Arc actions.
- **Arc** (Dashboard) — reads and writes: leads, bills, calendar, work blocks, notes. Ask it to do things, not just answer.
- **Brain** — notes. On phone, mic button → say *"note …"*.
- **Backup** — Settings → Export JSON, or `GET /api/export` (needs passcode header). Do it weekly until you trust KV.

## 8 · Editing content

Seed data lives in `data/*.json`. On first run the app reads them; after that live copies sit in KV under `cyborg:doc:<file>`. To reset a file to seed: delete that KV key in Vercel → Storage → Data browser. Static pages (EE, EHV, Compliance, Safety, Legal) are `data/pages.json` — edit, commit, push; Vercel redeploys.

## 9 · Not built yet · your call

Listed on Settings → **Next to build** with what each needs: Jobs store + Operations, Inbox via Graph, offline write queue, rules engine, recurring events. Full audit in `REVIEW-2026-09-28.md`.

## Troubleshooting

- **"Arc offline"** → not deployed, or `ANTHROPIC_API_KEY` missing, or you didn't redeploy after adding it.
- **Edits vanish between phone and laptop** → KV not connected. Settings → Cross-device sync should read `Vercel KV`.
- **Emails not arriving** → Resend domain not verified. Check Resend → Emails for bounce reason.
- **Wrong passcode** → server code is `DASHBOARD_PASSCODE`; if unset, local code `2026` applies per device.
- **Stale page after deploy** → the service worker caches; hard-refresh once, or Settings → Lock now → reload.

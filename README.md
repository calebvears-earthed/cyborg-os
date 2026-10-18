# CYBORG OS V2 · ATLAS JARVIS BUILD
## 17 October 2026

**Caleb's Cyborg + Atlas · the operational nervous system for Earthed High Voltage + Earthed Energy + Purple Earth.**

Stand-alone Next.js app. Atlas agent powered by Claude Sonnet 4.5 via Anthropic API. Supabase brain. M365 blend. Lives at `earthed.world`.

---

## 🎯 WHAT CALEB DOES (in order)

### Step 1 · GitHub (3 min)
Create a new PRIVATE repo at github.com/new:
- Owner: `calebvears-earthed`
- Name: `cyborg-os-v2`
- Private
- Don't initialise with README/gitignore/license (I've written them)

Copy the git URL (looks like `git@github.com:calebvears-earthed/cyborg-os-v2.git`)

### Step 2 · Drop the Supabase keys (2 min)
Open Supabase → Settings (gear bottom-left) → API
Copy these into a text file at `/OneDrive/000 unearthed/cyborg-v2-keys.txt`:

```
NEXT_PUBLIC_SUPABASE_URL=https://pqpzqjofgatevbkfoyij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste anon public key here>
SUPABASE_SERVICE_ROLE_KEY=<paste service_role secret key here>
SUPABASE_DB_PASSWORD=<the password you set when creating the project>
ANTHROPIC_API_KEY=<grab from console.anthropic.com/settings/keys>
```

### Step 3 · Push to GitHub (one-shot command)
Open Terminal.app on your Mac:
```bash
cd ~/Library/CloudStorage/OneDrive-earthedhv.au/000\ unearthed/cyborg-v2-build
git init
git add .
git commit -m "Initial Cyborg OS v2 scaffold"
git branch -M main
git remote add origin git@github.com:calebvears-earthed/cyborg-os-v2.git
git push -u origin main
```

### Step 4 · Vercel (3 min)
- Go to vercel.com/new
- Import `cyborg-os-v2` from GitHub
- Team: EarthedHUB
- Project name: `cyborg-os-v2` (or `earthed-world`)
- Framework preset: Next.js (should auto-detect)
- Environment Variables: paste all 5 from your keys file into the "Environment Variables" section
- Hit Deploy

### Step 5 · Supabase schema (2 min)
- Open Supabase → SQL Editor (left sidebar, the icon that looks like database)
- Click New Query
- Open `supabase/schema.sql` from this folder
- Paste the entire contents into Supabase SQL editor
- Hit Run

### Step 6 · Smoke test (1 min)
- Open your Vercel deployment URL
- Chat with Atlas
- Say "Remember my name is Caleb"
- Close tab, reopen URL
- Say "What's my name?"
- If Atlas says "Caleb" → **JARVIS STATE ACHIEVED**

### Step 7 · Point earthed.world domain (later tonight)
- In Cloudflare (once domains migrated), point `earthed.world` A record at Vercel
- In Vercel Project Settings → Domains → add `earthed.world`
- SSL auto-provisions · live in 5 min

---

## 📁 FILE STRUCTURE

```
cyborg-v2-build/
├── README.md                       (this file)
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
├── .gitignore
├── supabase/
│   └── schema.sql                  (paste into Supabase SQL editor)
├── src/
│   ├── app/
│   │   ├── layout.tsx              (root layout with Atlas chat always visible)
│   │   ├── page.tsx                (dashboard home)
│   │   ├── globals.css             (Cyborg palette · void black + plum + violet)
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts        (streaming Claude endpoint · the brain)
│   ├── components/
│   │   └── AtlasChat.tsx           (chat UI pane)
│   └── lib/
│       ├── supabase.ts             (Supabase client)
│       ├── anthropic.ts            (Anthropic client)
│       └── atlas-system-prompt.md  (Atlas personality + context)
```

---

## 🔐 SECURITY

- `.env.local` is in `.gitignore` · never commits to GitHub
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only · never exposed to client
- Supabase Row Level Security policies enabled on all tables
- Anthropic API key server-side only · never exposed

---

## 💰 RUNNING COST

- Supabase · Free tier for now ($0) · Pro at $25/mo when scale needs
- Vercel · Hobby/Free for now ($0) · Pro at $20/mo for custom domains without limits
- Anthropic API · pay per token · estimate $30-150/mo for daily personal use
- Total: ~$55-200/mo on top of your existing $340/mo Claude Max plan

---

## 🧠 WHAT ATLAS CAN DO (Day 1)

- Chat with you · streaming responses
- Remember across sessions (Supabase conversations + memories tables)
- Store + recall structured memories (user/project/feedback/reference types)
- Access OneDrive files (phase 3 wiring in evening block)
- Draft Outlook emails (phase 3 wiring in evening block)
- Create + query jobs in the Jobs module (built in evening block)

---

Built by Arc for Caleb · 17 Oct 2026 · 👾

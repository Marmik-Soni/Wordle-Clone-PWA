# Wordle Clone

A full-scale Wordle clone where every user gets the same 5-letter word each day. Six guesses to solve it. Tracks streaks and stats over time.

## Tech Stack

- **Framework:** Next.js (latest) with TypeScript
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS
- **Database:** Neon Postgres (via Vercel Postgres)
- **Auth:** NextAuth.js with Postgres adapter
- **Deployment:** Vercel
- **Cron Jobs:** Vercel Cron Jobs
- **Word Generation:** Gemini API (`gemini-2.5-flash-lite`, free tier)
- **PWA:** `next-pwa` (Workbox) — installable, offline-capable
- **Push Notifications:** Web Push API + VAPID + `web-push` npm package

## Features

- One word per day, same for all users
- 6 guesses maximum per day
- Game locks after winning or losing
- User stats: games played, win %, current streak, max streak, guess distribution
- Streak resets if a day is missed
- Words auto-generated and seeded via Gemini when supply runs low (≤5 remaining)
- Installable as a PWA — play from your home screen
- Offline support — game UI works without a connection (only the daily word fetch requires network)
- Daily push notification at 6PM reminding users who haven't played yet (_"Don't lose your streak 🔥"_)

## Daily Word System

Two cron jobs run daily:

- **`0 0 * * *` (midnight)** — Serves today's word to all users. Checks how many future words remain; if 5 or fewer are left, calls Gemini to generate and seed 30 new words with sequential future dates. Previously used words are passed in the prompt to avoid repetition.
- **`0 18 * * *` (6PM)** — Checks which users haven't played today and sends a Web Push notification to their device.

## PWA

The app is installable as a Progressive Web App via `next-pwa` (Workbox). The app shell, fonts, static assets, and game UI are cached for offline use. The daily word API route (`/api/word`) is never cached — it always fetches fresh.

## Web Push Notifications

Users who install the PWA can opt in to streak reminders. The browser generates a push subscription object that is saved to the DB linked to their account. The 6PM cron checks who hasn't played and sends a push notification via VAPID.

## Database Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE daily_words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(5) NOT NULL,
  date DATE UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  word_date DATE NOT NULL,
  solved BOOLEAN DEFAULT FALSE,
  guess_count INTEGER, -- 1-6, NULL if lost
  played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_date)
);

CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  guess_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'
);

CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL, -- full Web Push subscription object
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm
- A Neon Postgres database
- A Google Gemini API key
- A NextAuth secret

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GEMINI_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

### Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other Commands

```bash
pnpm build        # Production build
pnpm lint         # ESLint
pnpm format       # Prettier (write)
pnpm format:check # Prettier (check only)
```

## CI/CD

- **CI:** GitHub Actions — type check, lint, format check, and build on every push/PR to `main`
- **CD:** Vercel — auto-deploys on push to `main`, preview deployments for PRs

## Out of Scope

No social sharing, no multiplayer, no guess history. Clean and simple, just like the original.

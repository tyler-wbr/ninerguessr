# Niner Guessr

A GeoGuessr-style web game for the UNC Charlotte campus. Players see a campus photo, drop a pin on the campus map, and score points based on how close they were. Five rounds per game, per-difficulty leaderboards (best single game and best average over 5+ games).

> Working title. Not affiliated with UNC Charlotte.

## Stack

- **Next.js 14** (App Router, TypeScript, server components + route handlers)
- **Tailwind CSS**
- **Supabase** for Postgres + Auth + Storage (single vendor for v1)
- **Leaflet + react-leaflet** with OpenStreetMap tiles
- **Zod** for request validation
- **Upstash Redis** for rate limiting (optional in dev; in-memory fallback)
- **Deploy:** Vercel (app) + Supabase (data plane)

## Local setup

```bash
# 1. Install deps
npm install

# 2. Copy env and fill in Supabase keys (see "Supabase project setup" below)
cp .env.example .env.local

# 3. Push the schema to your Supabase project
#    Option A: use the Supabase CLI
#      npm i -g supabase
#      supabase link --project-ref <ref>
#      supabase db push
#    Option B: paste supabase/migrations/0001_init.sql and 0002_rls.sql into
#      the Supabase SQL editor in order (run 0001, then 0002).

# 4. Seed an admin user and placeholder locations
npm run seed

# 5. Run dev server
npm run dev
# -> http://localhost:3000
```

Default seeded admin: `admin@example.com` / `Passw0rd!`. Change `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env.local` before running seed if you don't want those defaults.

## Supabase project setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Copy credentials into `.env.local` from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL (must match the `ref` embedded in your keys)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **Publishable** key (`sb_publishable_...`) or legacy anon JWT
   - `SUPABASE_SERVICE_ROLE_KEY` — **Secret** key (`sb_secret_...`) or legacy service_role JWT (server-only; never commit)
3. In the SQL editor, run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) then [supabase/migrations/0002_rls.sql](supabase/migrations/0002_rls.sql). Choose **Run and enable RLS** for `0001`, then run `0002` immediately after.
4. Storage: the seed script auto-creates a **private** bucket called `location-photos`. If you prefer to make it yourself, create it under Storage and disable public access.
5. **Email confirmations:** in Authentication → Providers → Email, decide whether you want email confirmation on. For local dev you may want it off so signups log in immediately.
6. (Optional but recommended) Upstash Redis for rate limiting:
   - Create a free DB at [upstash.com](https://upstash.com)
   - Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`
   - Without these, an in-memory limiter is used (fine for local dev, not safe in serverless).

### Promote a real user to admin

After signing up through `/register`, run this in the Supabase SQL editor:

```sql
update profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

## Campus boundary

The playable area is defined in [data/campus-boundary.json](data/campus-boundary.json). The map overlay and out-of-bounds scoring both read from this file; [lib/campusBoundary.ts](lib/campusBoundary.ts) derives Leaflet rings automatically.

To regenerate from [UNC Charlotte OpenGIS](https://openmaps.uncc.edu/opengis/rest/services/AllCampusNew/MapServer) building footprints:

```bash
npm run fetch:boundary
```

## How to add photos (you, as content creator)

1. Log in as an admin user.
2. Go to `/admin/new`.
3. Choose the photo file.
4. Set title (optional), difficulty, and hint (optional).
5. Click the location on the map to drop a marker. Drag to fine-tune.
6. Toggle "Publish immediately" if you want it live for play; otherwise leave as draft.
7. Save. The photo uploads to a private Storage bucket; the play UI only ever sees short-lived signed URLs.

Tips:

- Take a wide enough mix that 5-round games don't repeat — aim for 15+ per difficulty before launch.
- Avoid identifiable people in frame.
- Note the capture date in the title if it's a seasonal-only landmark.

## Deploy checklist (Vercel + Supabase)

Use this before sharing the app publicly.

### Supabase (one-time)

- [ ] Migrations `0001_init.sql` and `0002_rls.sql` applied to the production project
- [ ] `location-photos` storage bucket exists (private)
- [ ] **Authentication → URL Configuration** — Site URL set to your production domain (keep `http://localhost:3000` for local dev)
- [ ] Email confirmation setting matches how you want signup to work
- [ ] Default seed admin password changed or seed admin removed after setup

### Vercel

- [ ] Repo pushed to GitHub and imported at [vercel.com/new](https://vercel.com/new)
- [ ] All env vars from `.env.local` added to **Production** (and Preview if desired):

  | Variable | Required in prod |
  |----------|------------------|
  | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
  | `SUPABASE_SERVICE_ROLE_KEY` | Yes |
  | `SUPABASE_STORAGE_BUCKET` | Yes |
  | `UPSTASH_REDIS_REST_URL` | **Strongly recommended** |
  | `UPSTASH_REDIS_REST_TOKEN` | **Strongly recommended** |
  | Scoring / map vars | Optional (defaults exist) |

- [ ] First deploy succeeds (`next build`)
- [ ] Run `npm run seed` once against production Supabase (from your machine with prod env vars) **or** create admin + locations manually

### Post-deploy smoke test

- [ ] Home page loads; register / log in works
- [ ] Start and finish a 5-round game on each difficulty
- [ ] Leaderboard and profile update after completing games
- [ ] Admin can upload and publish a location
- [ ] Out-of-bounds guess off campus scores 0
- [ ] Test on a phone (play UI is usable)

### Custom domain (optional)

In Vercel → Project → Settings → Domains, add your domain and point DNS as instructed. Update Supabase **Site URL** to match.

## Project layout

```
app/                  Next.js App Router routes
  api/                Route handlers (games, admin, leaderboard)
  admin/              Admin pages (gated by middleware)
  play/               Game UI
  results/[gameId]/   Per-game breakdown
  leaderboard/        Tabs: difficulty x (single | avg)
  profile/            Per-user stats
components/Map/       Leaflet wrappers (client-only)
lib/
  supabase/           browser/server/admin clients + types
  campusBoundary.ts   GeoJSON → Leaflet rings (single source for map overlay)
  scoring.ts          haversine + score curve
  geo.ts              point-in-polygon for campus boundary
  rateLimit.ts        Upstash + memory fallback
  schemas.ts          zod schemas
  mapConfig.ts        center, boundary, bounds
data/
  campus-boundary.json
supabase/migrations/  0001_init.sql, 0002_rls.sql
scripts/
  seed.ts             admin user + placeholder locations
  fetch-campus-boundary.ts  regenerate boundary from UNCC GIS
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run seed` | Create admin + placeholder locations (reads `.env.local`) |
| `npm run fetch:boundary` | Regenerate `data/campus-boundary.json` from UNCC OpenGIS |
| `npm test` | Unit tests (scoring, geo) |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Security model

- All gameplay mutations go through `/api/games/*` route handlers using the **service-role** Supabase client on the server. The browser never receives location coordinates until the round's guess has been submitted.
- `lib/supabase/admin.ts` imports `server-only`. Any attempt to bundle it into a `"use client"` module is a build error.
- RLS denies direct anon/authenticated reads on `locations`, `games`, and `game_rounds`. Reads happen via server routes.
- Storage bucket is private; photos are served via short-lived signed URLs.
- Rate limits: 30 game starts/hour and 60 guesses/minute per user.

## TODOs / roadmap

- [ ] Replace OSM tiles with the UNC Charlotte ArcGIS service (verify terms of use)
- [ ] EXIF GPS auto-fill on photo upload
- [ ] Mobile UX polish (bottom-sheet map, swipe between photo and map)
- [ ] Anti-cheat hardening (per-round one-time photo tokens; server-rendered photo proxy so the URL leaks nothing)
- [ ] UNCC-email-only signup toggle
- [ ] Materialized leaderboard views + scheduled refresh
- [ ] Per-round timer + bonus
- [ ] Social share cards for completed games

## Out of scope (v1)

- Multiplayer / real-time rounds
- Street View integration
- Hints / power-ups
- Native mobile apps

## License

TBD.

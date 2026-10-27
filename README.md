# FERA: a living atlas of wildlife

**FERA** lets you search real wildlife from around the world, browse recent sightings that people have photographed, and save your favorite animals and sightings, with private notes, to a personal collection called **My Discoveries**.

Built for *Design, Build, Ship* (MPCS 51238), Assignment 4: Full Stack App.

- **Live site:** _add the Vercel URL here after deploying_ (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))
- **Wildlife data and photos:** [iNaturalist](https://www.inaturalist.org) (a public API; each photo is credited to its photographer)

## Core features

- **Search animals** by common or scientific name, or **browse by group** (birds, mammals, reptiles, amphibians, fish, insects, arachnids, mollusks).
- **Animal pages:** photos with credits, plain-language facts, a Wikipedia summary, and recent sightings.
- **Sighting pages:** one photo, one place, one day, with the observer's credit. Hidden (obscured) locations are labelled "Approximate", and coordinates are never shown.
- **Save animals and sightings** with a ♡ on any card or a button on any page. Saving is instant, and a message links to your collection.
- **My Discoveries:** your saved animals and sightings, each with an optional **private note**. Removing an item asks first, because it deletes its note too.
- **Accounts:** sign up, sign in and sign out with Clerk. Your collection is private, and it's there on any device.
- **Designed states** for loading (skeleton screens), nothing found (with tips), and the API being down (with *Try again*).

## Technology

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components) and Tailwind CSS 4, in TypeScript |
| Sign-in | [Clerk](https://clerk.com) (development instance) |
| Database | [Supabase](https://supabase.com) Postgres with Row Level Security |
| External API | [iNaturalist API](https://api.inaturalist.org/v1/docs/), called from the server only |
| Testing | Playwright with `@clerk/testing` |
| Hosting | Vercel (Hobby plan) |

## How it works

### Clerk authentication
- `proxy.ts` runs Clerk on every request. Each protected page and Server Action calls `auth.protect()` itself, so signed-out visitors are redirected to `/sign-in`.
- Clerk issues a signed session token for each signed-in user. FERA sends it to Supabase on every database request.

### Supabase database and RLS
- Two tables, `saved_species` and `saved_observations`, each with a `user_id` column that holds the Clerk user ID (taken from the token, never sent by the browser).
- **RLS is on for both tables**, with `SELECT`, `INSERT`, `UPDATE` and `DELETE` policies that only allow a user to touch rows where `user_id` matches their own token. Signed-out users have no access, `TRUNCATE` is never granted, and only the `note` column can be updated.
- Supabase trusts Clerk through **Third-Party Auth** (no shared secret, no deprecated JWT templates). The app uses only the publishable key.
- Schema and policies: [supabase/migrations/](supabase/migrations). Full data model: [AGENTS.md](AGENTS.md).

### iNaturalist integration
- All iNaturalist calls happen **on the server** ([lib/inaturalist.ts](lib/inaturalist.ts)), with a shared cache, an 8-second timeout, input validation, and just the fields FERA needs.
- When you save something, the browser sends only an ID. The server fetches the details from iNaturalist and stores a small snapshot (names, photo link, credit) so your collection loads fast and still works if iNaturalist is down.
- **Request flow diagram** (browser → server → Clerk → iNaturalist → Supabase → screen): [docs/REQUEST_FLOW.md](docs/REQUEST_FLOW.md)

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Create `.env.local` yourself (it is git-ignored) with these variables. Get the values from your own Clerk and Supabase dashboards:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk, API keys (publishable) |
| `CLERK_SECRET_KEY` | Clerk, API keys (**secret**, server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase, publishable key (**never** the secret key) |

Then in Supabase, apply the SQL in `supabase/migrations/` in order, and add Clerk under *Authentication, Sign In / Providers, Third-Party Auth*. Never commit `.env*` files.

## Testing

```bash
E2E_USER_A_EMAIL=<user-a-email> E2E_USER_B_EMAIL=<user-b-email> npx playwright test
```

- **Two-user end-to-end test** (real Clerk sessions, in two browser contexts): each user saves a different animal and note through the UI; neither can see or change the other's data; saved items persist after a refresh; a signed-out visitor is redirected.
- **RLS failure experiment:** the same isolation assertion was run against a disposable copy of the table, with RLS deliberately weakened (the test failed), then restored (the test passed). The real tables were never weakened.
- Full write-up with the actual results: [docs/STEP_7_E2E_TESTING.md](docs/STEP_7_E2E_TESTING.md)
- Security review: [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md)
- Peer usability test: [docs/PEER_USABILITY_TEST.md](docs/PEER_USABILITY_TEST.md)

## Deployment

Hosted on Vercel's free Hobby plan, deploying the `main` branch, with the four environment variables above entered in the Vercel dashboard. Step-by-step: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project documentation

| Document | What it covers |
|---|---|
| [AGENTS.md](AGENTS.md) | Project context, data model, decisions, and working rules |
| [STEP_1_API_EXPLORATION.md](STEP_1_API_EXPLORATION.md) | Real iNaturalist responses, fields, and empty-search behavior |
| [docs/REQUEST_FLOW.md](docs/REQUEST_FLOW.md) | One request, from the click to the screen |
| [docs/STEP_7_E2E_TESTING.md](docs/STEP_7_E2E_TESTING.md) | The Playwright test and the RLS failure experiment |
| [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) | Security review findings and fixes |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel deployment and production checks |
| [docs/PEER_USABILITY_TEST.md](docs/PEER_USABILITY_TEST.md) | A five-minute test for a first-time user |

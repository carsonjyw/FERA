# FERA — Project Context

Assignment 4: Full Stack App · Design, Build, Ship · MPCS 51238 · Autumn 2026

**Read this file before building anything.** It records decisions already made with the project owner. Do not change the data model or make product decisions without discussing them first.

## Project

FERA is a web application where users can discover and explore real wildlife from around the world, search for animals, browse wildlife observations, and save their favorite discoveries to revisit later. Each person signs in and sees only their own saved items.

## Tech Stack

- Next.js + Tailwind CSS
- Clerk for sign-in (stay on development keys)
- Supabase for the database, with row-level security on every table
- iNaturalist API (`https://api.inaturalist.org/v1`) as the one external API, with no key required
- Deployed on Vercel (free Hobby plan); code in the owner's GitHub repository

## Progress

| Step | Status |
|---|---|
| 1. Choose tool and API | ✅ Done. See `STEP_1_API_EXPLORATION.md` |
| 2. Plan the data | ✅ Done. Data model below |
| 3–8 | Not started |

No tables, Clerk configuration, Supabase project, or application code exist yet.

## Decisions Made (Step 2)

| # | Decision |
|---|---|
| 1 | Save **both** species and individual observations (sightings) |
| 2 | Users can add an optional **private note** to any saved item |
| 3 | **No custom collections** for now (may be considered later) |
| 4 | **Two separate tables**: `saved_species` and `saved_observations` |
| 5 | **Snapshot caching**: store the iNaturalist ID plus only the essential display info (names, image URL, photo attribution) |

There is no `users` table. Clerk owns user accounts. Our tables only reference the Clerk user ID.

---

## Data Model

### `saved_species`

Animals (taxa) a user has saved.

| Column | Type | Constraints / Default | Source / Purpose |
|---|---|---|---|
| `id` | `uuid` | primary key, default `gen_random_uuid()` | Row ID |
| `user_id` | `text` | not null, default `auth.jwt()->>'sub'` | **Owner**: Clerk user ID |
| `taxon_id` | `integer` | not null | iNaturalist taxon `id` (e.g. `42069`) |
| `common_name` | `text` | nullable | `preferred_common_name` (e.g. "Red Fox"); some taxa have none |
| `scientific_name` | `text` | not null | `name` (e.g. "Vulpes vulpes") |
| `iconic_group` | `text` | nullable | `iconic_taxon_name` (e.g. "Mammalia"), used to group "My Discoveries" |
| `photo_url` | `text` | nullable | `default_photo.medium_url` |
| `photo_attribution` | `text` | nullable | `default_photo.attribution`, which must be shown with the photo |
| `note` | `text` | nullable, `char_length(note) <= 2000` | User's private note |
| `created_at` | `timestamptz` | not null, default `now()` | When it was saved |

Table constraint: `UNIQUE (user_id, taxon_id)`, so a user can save each species only once.

### `saved_observations`

Specific sightings a user has saved.

| Column | Type | Constraints / Default | Source / Purpose |
|---|---|---|---|
| `id` | `uuid` | primary key, default `gen_random_uuid()` | Row ID |
| `user_id` | `text` | not null, default `auth.jwt()->>'sub'` | **Owner**: Clerk user ID |
| `observation_id` | `bigint` | not null | iNaturalist observation `id` (e.g. `411190259`) |
| `taxon_id` | `integer` | nullable | `taxon.id`, a soft link to `saved_species` (no FK); null if the sighting is unidentified |
| `common_name` | `text` | nullable | `taxon.preferred_common_name`, falling back to `species_guess` |
| `photo_url` | `text` | nullable | `photos[0].url`, resized to `medium` |
| `photo_attribution` | `text` | nullable | `photos[0].attribution` |
| `observed_on` | `date` | nullable | When the animal was seen |
| `place_guess` | `text` | nullable | Readable location (e.g. "Wellington Township, OH 44090, USA") |
| `observer_login` | `text` | nullable | `user.login`, the person who made the sighting |
| `note` | `text` | nullable, `char_length(note) <= 2000` | User's private note |
| `created_at` | `timestamptz` | not null, default `now()` | When it was saved |

Table constraint: `UNIQUE (user_id, observation_id)`, so a user can save each sighting only once.

The link back to iNaturalist is not stored. It is built from the ID: `https://www.inaturalist.org/observations/{observation_id}`.

### Diagram

```mermaid
erDiagram
    CLERK_USER ||--o{ saved_species : "owns (user_id)"
    CLERK_USER ||--o{ saved_observations : "owns (user_id)"
    saved_species }o..o{ saved_observations : "same taxon_id (soft link, no FK)"

    CLERK_USER {
        text id "user_2abc... (lives in Clerk, not Supabase)"
    }
    saved_species {
        uuid id PK
        text user_id "owner = JWT sub"
        int taxon_id "UNIQUE with user_id"
        text common_name
        text scientific_name
        text iconic_group
        text photo_url
        text photo_attribution
        text note "optional, private"
        timestamptz created_at
    }
    saved_observations {
        uuid id PK
        text user_id "owner = JWT sub"
        bigint observation_id "UNIQUE with user_id"
        int taxon_id
        text common_name
        text photo_url
        text photo_attribution
        date observed_on
        text place_guess
        text observer_login
        text note "optional, private"
        timestamptz created_at
    }
```

Plain-text version:

```
                    ┌────────────────────────────┐
                    │      Clerk (external)      │
                    │  user.id = "user_2abc…"    │
                    └─────────────┬──────────────┘
                                  │ JWT "sub" claim = user_id
              ┌───────────────────┴────────────────────┐
              │ 1 user ── many rows                    │ 1 user ── many rows
              ▼                                        ▼
┌──────────────────────────────┐        ┌──────────────────────────────────┐
│ saved_species                │        │ saved_observations               │
├──────────────────────────────┤        ├──────────────────────────────────┤
│ id              uuid PK      │        │ id               uuid PK         │
│ user_id         text ◄ owner │        │ user_id          text ◄ owner    │
│ taxon_id        int          │◄ ─ ─ ─ │ taxon_id         int             │
│ common_name     text         │  soft  │ observation_id   bigint          │
│ scientific_name text         │  link  │ common_name      text            │
│ iconic_group    text         │ (no FK)│ photo_url        text            │
│ photo_url       text         │        │ photo_attribution text           │
│ photo_attribution text       │        │ observed_on      date            │
│ note            text (opt.)  │        │ place_guess      text            │
│ created_at      timestamptz  │        │ observer_login   text            │
│ UNIQUE(user_id, taxon_id)    │        │ note             text (opt.)     │
└──────────────┬───────────────┘        │ created_at       timestamptz     │
               │                        │ UNIQUE(user_id, observation_id)  │
               │ taxon_id               └────────────────┬─────────────────┘
               ▼                                         ▼ observation_id
     ┌──────────────────────────────────────────────────────────────┐
     │           iNaturalist API (external, read-only)              │
     │       /v1/taxa/{taxon_id}       /v1/observations/{id}        │
     └──────────────────────────────────────────────────────────────┘
```

### Relationships

- **User → rows:** one Clerk user owns many rows in each table. Every row belongs to exactly one user, identified by `user_id`.
- **Between tables:** `saved_observations.taxon_id` can match `saved_species.taxon_id`, which allows features like "3 of your sightings are Red Foxes." There is no foreign key, because a user can save a sighting without saving its species (and vice versa).
- **To iNaturalist:** `taxon_id` and `observation_id` are iNaturalist IDs. The cached columns are a small snapshot for display. Detail pages fetch fresh data from the API.

### Who owns what

| Data | Owner | Stored in |
|---|---|---|
| Account, email, sign-in | Clerk | Clerk |
| Saved species, saved sightings, notes | The individual user | Supabase, tagged with `user_id` |
| Species info, photos, sightings | iNaturalist (public) | Not stored, except the cached snapshot |

---

## How `user_id` Identifies the Owner

1. A user signs in with Clerk. Clerk issues a signed session token (JWT) whose `sub` claim is the Clerk user ID, e.g. `user_2abc…`.
2. The app sends this token with every Supabase request.
3. Supabase's **third-party auth integration with Clerk** verifies the token's signature, so `auth.jwt()` inside the database can be trusted.
4. On insert, `user_id` defaults to `auth.jwt()->>'sub'`, so the database fills in the owner. The client should not send `user_id`. If it does, the RLS insert check rejects any value that isn't the signed-in user's own ID.
5. `user_id` is `text`, not `uuid`, because Clerk IDs are not UUIDs.

## Planned Row-Level Security (RLS)

RLS will be **enabled on both tables**. With RLS on and no matching policy, access is denied. That means signed-out visitors (no valid Clerk token) can read nothing.

The same four policies apply to `saved_species` and `saved_observations`, all for the `authenticated` role:

| Operation | Policy (plain words) | Check |
|---|---|---|
| **SELECT** | You can read only your own rows | `USING ((auth.jwt()->>'sub') = user_id)` |
| **INSERT** | You can add rows only as yourself | `WITH CHECK ((auth.jwt()->>'sub') = user_id)` |
| **UPDATE** | You can edit only your own rows (in practice, the `note`), and can't hand a row to someone else | `USING ((auth.jwt()->>'sub') = user_id)` and `WITH CHECK ((auth.jwt()->>'sub') = user_id)` |
| **DELETE** | You can remove (unsave) only your own rows | `USING ((auth.jwt()->>'sub') = user_id)` |

Notes:
- `USING` filters which existing rows a query can see or touch. `WITH CHECK` validates the new or changed row.
- No policies are granted to the `anon` role.
- Tables and policies will be created as **migrations** in Step 5. Nothing is created yet.

## How the Model Supports the App

- **"My Discoveries":** `select * from saved_species` and `select * from saved_observations`. RLS returns only the signed-in user's rows, with no manual filtering needed for security.
- **Save / unsave:** an insert or a delete. The unique constraints make a repeated save harmless.
- **Notes:** an update of the `note` column on the user's own row.
- **Persistence:** rows live in Supabase, so saved items survive signing out and back in, and work on any device.
- **Snapshot caching:** "My Discoveries" loads with one database query per table instead of one API call per item. It respects iNaturalist's ~60 requests/minute guidance and still shows saved items when the API is down. The trade-off is that cached names or photos may go out of date. Detail pages always load fresh data.

## API Notes (from Step 1)

- "Not found" returns **HTTP 200** with `total_results: 0` and `results: []`, so check `total_results`, not the status.
- Search matches the start of names and **does not correct typos**.
- **Invalid parameters are silently ignored**, so validate inputs before calling.
- Many photos are "all rights reserved", so **always display photo attribution**.
- Some sighting locations are deliberately obscured (`obscured`, `geoprivacy`), so don't present them as exact.
- Required UI states: **loading**, **nothing found**, **API unavailable**.

## Working Rules for the Agent

- Work one assignment step at a time and wait for approval before moving on.
- Do not make product or design decisions without discussing them. No visual style, palette, or layout has been chosen.
- Do not change this data model without discussion. If a change is agreed, update this file first.
- Keys go in `.env.local` only, never in code or commits.
- Do not modify other projects outside the FERA folder.

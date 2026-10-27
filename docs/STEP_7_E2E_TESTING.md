# Step 7: End-to-end testing with Playwright

Assignment requirement: *one end-to-end Playwright test where two users sign in, each saves something, and neither can see the other's data; break row-level security on purpose, watch the test fail, then fix it and watch it pass.*

## Summary

| What | Result |
|---|---|
| **Two-user test against the real app and real tables** (`e2e/two-users.spec.ts`) | ✅ Passes (final run: 1 passed, 15.9 s) |
| **RLS experiment, phase 1: policies correct** (disposable table) | ✅ Passed |
| **Phase 2: policies deliberately weakened** (disposable table) | ❌ **Failed**, as intended: `User B can see User A's rows` |
| **Phase 3: policies restored**, same test | ✅ Passed |
| **Phase 4: disposable table removed** | ✅ Dropped |
| FERA's real `saved_species` / `saved_observations` security after the experiment | ✅ Unchanged (fingerprint identical before and after) |
| `npm run lint`, `npm run build` | ✅ Clean |

> **Scope, stated plainly.** The two-user Playwright test validates the **real application** (real Clerk sessions, real FERA UI, real Supabase tables and policies). The deliberate RLS failure was **not** done to the real tables. It was done on a separate, disposable table, `rls_experiment_saved_species`, that was created for the experiment and dropped afterwards. FERA's real `saved_species` and `saved_observations` policies were never disabled or weakened.

## How the tests work

Files: `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/helpers.ts`, `e2e/two-users.spec.ts`, `e2e/rls-experiment.spec.ts`, `e2e/sql/*.sql`.

### The two-user test (`e2e/two-users.spec.ts`)

One test, run in this order:

1. **Sign in User A and User B** in two separate browser contexts (separate cookies, separate Clerk sessions). It checks they are two different Clerk users.
2. **Choose test animals** that neither user already has in their real collection (see "Test data" below).
3. **User A** opens an animal page, clicks *Save this animal*, then adds a private note in My Discoveries. **User B** does the same with a different animal. All through the real FERA interface.
4. **User A's My Discoveries** shows User A's animal and does not show User B's animal or User B's note. **User B's** shows the reverse.
5. **Refresh:** both users reload My Discoveries and still see their own animal and note (persistence).
6. **Direct attacks as User B**, using User B's real Clerk token against Supabase's REST API on the real `saved_species` table. Each must fail:
   - list rows: User A's row must not appear
   - read User A's row (and private note) by ID: nothing returned
   - change User A's note: 0 rows changed
   - delete User A's row: 0 rows deleted
   - insert a row claiming to belong to User A: rejected
   - afterwards, User A's row and note are still there, unchanged
7. **A signed-out visitor** opening My Discoveries is redirected to sign-in.
8. **Cleanup** (in a `finally`): each user deletes only the row this test created, through their own session.

### How the two users are authenticated

- Both are **real accounts in FERA's Clerk development instance**. Nothing is mocked.
- Sign-in uses Clerk's official testing helper (`@clerk/testing`, `clerk.signIn({ emailAddress })`). Clerk's Backend API creates a one-time sign-in token for the existing user, and the browser signs in with it. **No passwords are typed or stored.**
- Each user's Clerk session lives in its own browser context. The test reads each user's real Clerk session token from the page (`window.Clerk.session.getToken()`, waiting for Clerk to load first) and sends it to Supabase, exactly like the app's server does. Supabase verifies it through Third-Party Auth, so RLS sees the real Clerk user ID.
- Tokens last about a minute, so a fresh one is requested for every call.

### Running it

The two account emails come from environment variables on the command line, so they are not stored in any file in the repo. The Clerk and Supabase values come from `.env.local`, which the test process reads at runtime (it is never printed).

```bash
E2E_USER_A_EMAIL=<user-a-email> E2E_USER_B_EMAIL=<user-b-email> npx playwright test
```

The config builds the app and serves it on port 3100 (so it doesn't clash with `npm run dev`). Traces and videos are turned off on purpose, because they record request headers that include tokens. Screenshots are taken only on failure, and the `test-results/` and `playwright-report/` folders are git-ignored.

### Test data and personal discoveries

- **Before saving anything,** the test reads both users' real collections. User A already had **Red Fox** saved in their real collection, so the test did not use it: it picked spare animals instead (**User A: Rock Pigeon, User B: Mallard**). The pool is Red Fox, Mallard, Rock Pigeon, American Crow, Eastern Gray Squirrel, Gray Wolf, Western Honey Bee.
- **Cleanup deletes only rows the test created.** After the final run, `saved_species` contained exactly one row: User A's original Red Fox. No test rows remain, and neither Clerk account was touched.

## The RLS failure experiment

The same isolation assertion (`assertIsolation` in `e2e/helpers.ts`) is used for both the real-table check in the two-user test and the experiment. In the experiment, it runs against `public.rls_experiment_saved_species`, a **disposable copy of `saved_species`** (`create table … (like public.saved_species including all)`), given the same grants and four equivalent policies. I checked the copy matched: all 11 columns, the primary key, `UNIQUE (user_id, taxon_id)`, the note-length check, RLS enabled, four policies and the same privileges. It was created with plain SQL (not a migration), so the project's migration history is unchanged. The SQL is in `e2e/sql/`.

| Phase | What I did | Result of `rls-experiment.spec.ts` |
|---|---|---|
| 1. RLS enabled | Original owner-check policies on the disposable table | ✅ **Passed** (6.4 s) |
| 2. RLS weakened | Changed the SELECT, UPDATE and DELETE policies to `using (true)` (UPDATE also `with check (true)`), a classic "forgot to check the owner" mistake. Confirmed in `pg_policies`. | ❌ **Failed** (5.7 s) |
| 3. RLS restored | Put the original owner-check expressions back. Confirmed in `pg_policies`. | ✅ **Passed** (7.9 s) |
| 4. Cleanup | `drop table public.rls_experiment_saved_species` | Table gone |

### The actual failure (phase 2)

```
Error: [rls_experiment_saved_species] User B can see User A's rows

- Expected  - 1
+ Received  + 7

- Array []
+ Array [
+   Object {
+     "note": "A's private experiment note 1793135991477",
+     "taxon_id": 880001,
+     "user_id": "user_3LI7…",
+   },
+ ]
       at assertIsolation (e2e/helpers.ts:113)
```

**Why it failed:** with `using (true)`, the database no longer checks whose row it is. User B's legitimate request, `GET` the table with User B's real token, returned User A's row, including A's **private note**. The test asserts that User B must never see User A's rows, so it caught the leak immediately. (The assertion stops at its first failure, so the update and delete checks that come after it were not reached in this run. They are the same kind of check and would be caught by the same weakened policies.)

**What changed when RLS was restored:** the original expression `((select auth.jwt()) ->> 'sub') = user_id` was back on all of the policies, User B's read returned only User B's row, and the unchanged assertion passed.

### Proof the real tables were never touched

A fingerprint (an md5 hash over every policy definition, RLS flag, table grant and column grant on `saved_species` and `saved_observations`) was taken before and after the experiment:

| | Fingerprint | Items |
|---|---|---|
| Before | `b93eafbadcab24f58371a64a52eb49d4` | 18 |
| After | `b93eafbadcab24f58371a64a52eb49d4` | 18 |

After the experiment, the `public` schema again had only the 2 real tables with 8 policies, and `list_migrations` still showed only the 2 original migrations.

## Problems found and fixed while building the test

Honest notes, because each one is a good talking point:

1. **A flaky locator in the test.** The first full run failed: Playwright's strict mode found two matching cards for a moment while the page streamed in. The app was fine (the screenshot showed one correct card). Fix: the test now targets only visible cards inside the main content.
2. **A race in the test.** After a page reload, the test asked for the Clerk token before Clerk's browser script had restored the session. Fix: wait for the session first.
3. **A real (harmless) server-log issue in the app.** The server log showed an error from `getSavedIds` when Next.js re-rendered the cached home page in the background while a signed-in request was in flight. Users were never affected, but it was noisy. Fix: `lib/saved.ts` now waits for a real request (`await connection()`) before reading per-user data.
4. **Spare animals.** Red Fox was already in User A's real collection, so the test used a spare animal instead of touching it.

## Limitations

- The test saves animals through the live iNaturalist API, so a slow or unavailable API could make a run fail.
- The UI part of the test covers saved animals; the direct database attacks cover `saved_species`. `saved_observations` has the same policies (verified by the fingerprint and the Step 5 SQL tests) but is not part of this Playwright test.
- Clerk development instance only, as the course requires.

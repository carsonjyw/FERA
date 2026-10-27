# Submission: FERA (Assignment 4: Full Stack App)

Submit in Google Classroom:

| | |
|---|---|
| **1. Vercel URL** | _paste the live URL_ |
| **2. GitHub URL** | https://github.com/carsonjyw/FERA (the README and commit history show progress) |

## Project description (short)

FERA is a wildlife atlas. People search real animals from around the world, browse recent photographed sightings, and save the ones they like, with private notes, to a personal collection called My Discoveries. Wildlife data and photos come from the iNaturalist API (called from the server, with caching and designed loading, nothing-found and API-down states). Accounts use Clerk, and each person's saved data lives in Supabase behind Row Level Security, so everyone sees only their own. Built with Next.js, Tailwind, Clerk, Supabase and Vercel.

## Security and testing summary

- **Accounts:** sign-up, sign-in and sign-out with Clerk. Private pages and every Server Action check the session themselves.
- **Data:** Supabase tables with RLS on, owner-check policies for read, insert, update and delete, no access for signed-out visitors, no TRUNCATE, and only the note column editable.
- **Keys:** only in environment variables (`.env.local` locally, Vercel in production), a deny rule stops the agent reading `.env` files, the secret keys are never used in browser code, and the Supabase secret key isn't used at all.
- **Test:** a real Playwright end-to-end test with two signed-in Clerk users: each saves a different animal and note; neither can see or change the other's; saved data persists after a refresh. It also attacks the real table with the second user's real token.
- **Watched failing, then passing:** on a disposable copy of the table, RLS was deliberately weakened and the test failed ("User B can see User A's rows"), then restored and the test passed. The real tables were never weakened (their policy fingerprint was identical before and after).
- **Review:** `/security-review` run on the Step 8 branch, plus a manual whole-app review and `npm audit` (0 vulnerabilities). Findings and fixes: [SECURITY_REVIEW.md](SECURITY_REVIEW.md).
- **Process:** step-by-step branches merged by pull request, with commits showing progress.

## Assignment checklist (from the PDF)

| Requirement | Evidence |
|---|---|
| Accounts: sign up, sign in, sign out; signed-out visitor sees no one's data | Clerk; Playwright test and live check |
| Data saved in Supabase with RLS on every table | `supabase/migrations/`, policies, advisors clean |
| API data with loading, nothing-found and API-down states | `components/states.tsx`; tested (Step 6) |
| What you save persists after sign-out/back in, and on another device | Playwright refresh check; manual test |
| Keys in environment variables, deny rule for `.env` files | `.claude/settings.json`, `.gitignore`, Vercel env vars |
| One Playwright test, two users, watched failing before passing | [STEP_7_E2E_TESTING.md](STEP_7_E2E_TESTING.md) |
| `/security-review` on a branch, findings handled | [SECURITY_REVIEW.md](SECURITY_REVIEW.md) |
| Live on Vercel; a classmate can make an account and use it | Live URL; [PEER_USABILITY_TEST.md](PEER_USABILITY_TEST.md) |
| UI/UX: design process and principles | AGENTS.md, README, Living Atlas design, instructor-feedback changes |
| GitHub repo with README and commit history | Repository |

## Be ready to explain (class)

1. **Tracing a request:** [REQUEST_FLOW.md](REQUEST_FLOW.md): the click, the server, Clerk, iNaturalist, Supabase and the screen.
2. **How access is controlled:** the app knows who you are from your Clerk session; the database decides what you may see with RLS (`user_id` must match your token's `sub`).
3. **Where API calls happen:** on the server: shared cache for the rate limit, trustworthy saved snapshots, one place for error handling, no key needed.
4. **Testing:** the first full run failed for test-code reasons (a flaky locator, a token race); the RLS experiment failed on purpose with "User B can see User A's rows" because the policy was weakened to `using (true)`, and passed once the owner check was restored.
5. **Agentic workflow:** what was stopped: the agent never read `.env` files (deny rule), never weakened the real RLS policies (experiment on a disposable table), never created accounts or committed for me. What was caught reading changes: stale docs, a test race, and URL and argument validation gaps.

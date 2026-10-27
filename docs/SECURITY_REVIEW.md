# Security review (Step 8)

Branch: `step-8-deploy`. Date: 2026-10-27.

## What was run

1. **`/security-review`** (Claude Code's built-in command), run on the Step 8 branch as the assignment requires. It reviews the branch's diff against `main`. Because `main` already contained Steps 1 to 6 (merged by pull request), its automatic scope was the Step 7 changes: the Playwright tests, `lib/saved.ts`, and dev dependencies. **Result: no findings.** (The test files are out of its scope by design, and `await connection()` in `lib/saved.ts` only reduces what runs during prerendering.)
2. **A manual review of the whole application**, since the command's scope was narrow. Details below.
3. **`npm audit`:** 0 vulnerabilities (production and development dependencies).

## Manual review

| Area | What I checked | Result |
|---|---|---|
| **Authentication** | Every private page and Server Action calls Clerk's `auth.protect()` itself (not only the proxy). Signed-out `/discoveries` redirects to sign-in and the response contains no private data. | ✅ |
| **Authorization / RLS** | Both tables have RLS on with four owner-check policies, signed-out users have no grants, `TRUNCATE` isn't granted, and only `note` is updatable. The Step 7 Playwright test attacks the real table with a second user's real token (read, update, delete, forge): all fail. A hash of the policies and grants was identical before and after the RLS experiment. Supabase's security and performance advisors report no issues. | ✅ |
| **Environment variables and secrets** | App code reads only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public by design; protected by RLS), plus the test-only `INAT_API_BASE`. The Clerk secret key is read only by Clerk's own server code. The Supabase secret key / service role is never used. `.env*` is git-ignored, and a scan of every committed file found no keys or tokens. | ✅ |
| **Server Actions and input validation** | The browser sends only an ID (plus a note, or the item type). IDs must be positive integers, the type must be exactly `species` or `observation`, and notes are limited to 2,000 characters. `user_id` is never accepted from the client: the database fills it in from the Clerk token. The saved snapshot is built on the server from iNaturalist, not trusted from the browser. Errors returned to the browser are generic. | ✅ (type check added, see below) |
| **API request security** | iNaturalist is called only from the server, at a fixed host. Parameters are set through `URL.searchParams` (encoded), IDs are validated first, requests time out after 8 seconds, and failures are turned into a safe "unavailable" state. No API key is involved. | ✅ |
| **Output handling (XSS)** | No `dangerouslySetInnerHTML`, `eval` or `innerHTML` anywhere. React escapes all rendered text. The Wikipedia summary is stripped of HTML before display. External links use `rel="noreferrer"`. | ✅ |
| **Dependencies and configuration** | 0 known vulnerabilities. No unused packages were added. | ✅ |

## Fixes made before deploying

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | Links and image sources built from iNaturalist data (`wikipedia_url`, photo URLs) weren't restricted to a URL scheme, so a `javascript:` value could in theory become a clickable link | Low (defense in depth) | `safeHttpUrl()` in `lib/inaturalist.ts` accepts only `http(s)` URLs |
| 2 | No standard security headers | Low | `next.config.ts` now sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, and no `X-Powered-By` |
| 3 | The `kind` argument of the remove and note Server Actions wasn't validated (any other value was treated as "sighting") | Low | Both actions reject anything but `species` or `observation` |
| 4 | `getSavedIds` could start reading per-user data while Next.js prerendered a cached page in the background (harmless, but it logged errors) | Info | `await connection()` waits for a real request first (done in Step 7) |

## Accepted risks and notes

- **Clerk development keys in production** (as the course requires). The sign-in screen shows "Development mode", and development instances have lower limits than production ones.
- **No strict Content-Security-Policy.** Clerk's prebuilt sign-in needs script and frame allowances that depend on the instance, so a strict CSP risked breaking sign-in.
- **No rate limiting of FERA's own endpoints.** iNaturalist responses are cached and shared between visitors, which keeps FERA well under iNaturalist's ~60 requests per minute. Vercel Hobby and Clerk provide basic protection.
- **Unknown IDs show the friendly "not found" page with HTTP 200,** because the response has already started streaming. This is cosmetic and exposes nothing.
- **`INAT_API_BASE` is a test-only override. Do not set it in Vercel.**
- **`.mcp.json` (committed)** contains only the Supabase project reference; the MCP server still requires the owner's login. `.agents/skills/` contains Clerk's public skill files and no secrets.
- **Test accounts:** the Playwright sign-in uses one-time Clerk sign-in tokens. No passwords exist in any file, and the test emails are never committed.

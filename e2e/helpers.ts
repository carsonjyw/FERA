import { clerk } from "@clerk/testing/playwright";
import { type APIRequestContext, type Browser, type BrowserContext, type Page, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Configuration (all from the environment; nothing is stored in the repo)
// ---------------------------------------------------------------------------

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See docs/STEP_7_E2E_TESTING.md.`);
  return value;
}

const supabaseUrl = () => requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = () => requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

// ---------------------------------------------------------------------------
// Real Clerk sign-in. Each user gets their own browser context (own cookies,
// own Clerk session). No mocking: Clerk creates a one-time sign-in token for the
// existing user through its Backend API, and the browser signs in with it.
// ---------------------------------------------------------------------------

export type TestUser = { context: BrowserContext; page: Page; email: string };

export async function signInAs(browser: Browser, email: string): Promise<TestUser> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  // Prove the session is real: a signed-in user gets the My Discoveries link.
  await expect(page.getByRole("link", { name: /My Discoveries/ }).first()).toBeVisible({ timeout: 30_000 });
  return { context, page, email };
}

// A fresh Clerk session token (they live ~60 seconds, so never cache one).
// After a page load, Clerk's browser script can take a moment to restore the
// session, so wait for it instead of racing it.
type ClerkWindow = Window & { Clerk?: { session?: { getToken(): Promise<string | null> } } };

export async function getToken(page: Page): Promise<string> {
  await page.waitForFunction(() => Boolean((window as ClerkWindow).Clerk?.session), undefined, { timeout: 30_000 });
  const token = await page.evaluate(async () => (window as ClerkWindow).Clerk?.session?.getToken());
  expect(token, "a signed-in Clerk session token").toBeTruthy();
  return token as string;
}

// The Clerk user ID is the token's `sub` claim. Only decoded here, never logged.
export function userIdFromToken(token: string): string {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).sub;
}

// ---------------------------------------------------------------------------
// Direct calls to Supabase's REST API with a user's REAL Clerk token. These are
// the same requests the app's server makes, so Row Level Security is what decides.
// ---------------------------------------------------------------------------

type RestResult<T = Record<string, unknown>> = { status: number; rows: T[]; raw: string };

export async function rest(
  request: APIRequestContext,
  token: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<RestResult> {
  const response = await request.fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: supabaseKey(),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    data: body,
  });
  const raw = await response.text();
  let rows: Record<string, unknown>[] = [];
  try {
    const parsed = JSON.parse(raw);
    rows = Array.isArray(parsed) ? parsed : [];
  } catch {
    // error bodies are objects; `rows` stays empty and `status` tells the story
  }
  return { status: response.status(), rows, raw };
}

// ---------------------------------------------------------------------------
// THE isolation assertion. The two-user test runs it against FERA's real
// saved_species table; the RLS experiment runs the very same function against a
// disposable copy of that table. User A and User B each own one row.
// ---------------------------------------------------------------------------

export async function assertIsolation(
  request: APIRequestContext,
  o: {
    table: string;
    tokenA: () => Promise<string>;
    tokenB: () => Promise<string>;
    taxonA: number; // the row User A owns
    taxonB: number; // the row User B owns
    noteA: string; // User A's private note
  },
) {
  const t = o.table;
  const idA = userIdFromToken(await o.tokenA());

  // 1. B can't read A's row, and does see their own.
  const bAll = await rest(request, await o.tokenB(), "GET", `${t}?select=taxon_id,user_id,note`);
  expect(bAll.status, `[${t}] B listing rows`).toBe(200);
  expect(
    bAll.rows.filter((r) => r.user_id === idA),
    `[${t}] User B can see User A's rows`,
  ).toEqual([]);
  expect(
    bAll.rows.map((r) => r.taxon_id),
    `[${t}] User B should see their own row`,
  ).toContain(o.taxonB);

  // 2. B can't look A's row up directly.
  const bLookup = await rest(request, await o.tokenB(), "GET", `${t}?taxon_id=eq.${o.taxonA}&user_id=eq.${idA}&select=taxon_id,note`);
  expect(bLookup.rows, `[${t}] User B can read User A's row (and private note) by ID`).toEqual([]);

  // 3. B can't change A's note.
  const bUpdate = await rest(request, await o.tokenB(), "PATCH", `${t}?taxon_id=eq.${o.taxonA}&user_id=eq.${idA}`, {
    note: "HACKED by User B",
  });
  expect(bUpdate.rows, `[${t}] User B changed User A's note`).toEqual([]);

  // 4. B can't delete A's row.
  const bDelete = await rest(request, await o.tokenB(), "DELETE", `${t}?taxon_id=eq.${o.taxonA}&user_id=eq.${idA}`);
  expect(bDelete.rows, `[${t}] User B deleted User A's row`).toEqual([]);

  // 5. B can't insert a row that claims to belong to A.
  const bInsert = await rest(request, await o.tokenB(), "POST", t, {
    user_id: idA,
    taxon_id: 999000009,
    scientific_name: "spoofed by User B",
  });
  expect(bInsert.status, `[${t}] User B inserted a row as User A`).toBeGreaterThanOrEqual(400);

  // 6. After all of that, A's row and private note are untouched.
  const aRow = await rest(request, await o.tokenA(), "GET", `${t}?taxon_id=eq.${o.taxonA}&select=taxon_id,note`);
  expect(aRow.rows, `[${t}] User A's row should still exist`).toHaveLength(1);
  expect(aRow.rows[0].note, `[${t}] User A's private note was altered`).toBe(o.noteA);
}

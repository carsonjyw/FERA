import { expect, test } from "@playwright/test";
import { assertIsolation, getToken, requireEnv, rest, signInAs, type TestUser } from "./helpers";

// RLS failure experiment. This runs the SAME isolation assertion as the two-user
// test, but against a DISPOSABLE table (public.rls_experiment_saved_species) that
// is a copy of saved_species with equivalent policies. It lets us weaken RLS and
// watch the assertion fail without ever touching FERA's real tables.
// Setup and tear-down SQL: e2e/sql/. Skipped unless RLS_EXPERIMENT=1.

const TABLE = "rls_experiment_saved_species";
const TAXON_A = 880001;
const TAXON_B = 880002;

test.skip(!process.env.RLS_EXPERIMENT, "Only runs during the RLS experiment (RLS_EXPERIMENT=1).");

test("RLS isolation holds on the disposable test table", async ({ browser, request }) => {
  const a: TestUser = await signInAs(browser, requireEnv("E2E_USER_A_EMAIL"));
  const b: TestUser = await signInAs(browser, requireEnv("E2E_USER_B_EMAIL"));
  const noteA = `A's private experiment note ${Date.now()}`;

  const cleanup = async () => {
    for (const [user, taxon] of [
      [a, TAXON_A],
      [b, TAXON_B],
    ] as const) {
      await rest(request, await getToken(user.page), "DELETE", `${TABLE}?taxon_id=eq.${taxon}`).catch(() => {});
    }
  };

  try {
    await cleanup(); // leftovers from an earlier aborted run
    // Each user saves one row in the disposable table with their own real token.
    const insertA = await rest(request, await getToken(a.page), "POST", TABLE, {
      taxon_id: TAXON_A,
      scientific_name: "RLS experiment A",
      note: noteA,
    });
    expect(insertA.status, "User A inserting into the experiment table").toBe(201);
    const insertB = await rest(request, await getToken(b.page), "POST", TABLE, {
      taxon_id: TAXON_B,
      scientific_name: "RLS experiment B",
    });
    expect(insertB.status, "User B inserting into the experiment table").toBe(201);

    await assertIsolation(request, {
      table: TABLE,
      tokenA: () => getToken(a.page),
      tokenB: () => getToken(b.page),
      taxonA: TAXON_A,
      taxonB: TAXON_B,
      noteA,
    });
  } finally {
    await cleanup();
    await a.context.close();
    await b.context.close();
  }
});

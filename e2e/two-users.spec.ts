import { type Page, expect, test } from "@playwright/test";
import { assertIsolation, getToken, requireEnv, rest, signInAs, type TestUser, userIdFromToken } from "./helpers";

// The assignment's end-to-end test: two real signed-in users, each saves a
// different animal through the real FERA interface, and neither can see or touch
// the other's saved animals or private notes. It runs against the real app and
// the real Supabase tables (saved_species), with real Clerk sessions.

type Animal = { id: number; name: string };

// Test animals. Red Fox for User A and Mallard for User B are preferred. If a
// user already saved one of them in their REAL collection, a spare is used
// instead, so the test never touches (or deletes) anyone's personal discoveries.
const POOL: Animal[] = [
  { id: 42069, name: "Red Fox" },
  { id: 6930, name: "Mallard" },
  { id: 3017, name: "Rock Pigeon" },
  { id: 8021, name: "American Crow" },
  { id: 46017, name: "Eastern Gray Squirrel" },
  { id: 42048, name: "Gray Wolf" },
  { id: 47219, name: "Western Honey Bee" },
];

function pickAnimal(preferredId: number, taken: Set<number>, exclude: number[] = []): Animal {
  const ordered = [POOL.find((a) => a.id === preferredId)!, ...POOL.filter((a) => a.id !== preferredId)];
  const animal = ordered.find((a) => !taken.has(a.id) && !exclude.includes(a.id));
  if (!animal) throw new Error("No unused test animal left: every candidate is already in a real collection.");
  return animal;
}

async function savedTaxonIds(user: TestUser, request: Parameters<typeof rest>[0]): Promise<number[]> {
  const result = await rest(request, await getToken(user.page), "GET", "saved_species?select=taxon_id");
  expect(result.status, "reading the user's saved animals").toBe(200);
  return result.rows.map((r) => Number(r.taxon_id));
}

// Visible cards in the page content only. While a page streams in, Next.js can
// briefly hold a hidden copy of the content, which would trip Playwright's
// strict mode if the locator matched it too.
const card = (page: Page, name: string) =>
  page.locator("main li").filter({ hasText: name }).filter({ visible: true });

async function saveAnimalThroughUi(page: Page, animal: Animal) {
  await page.goto(`/species/${animal.id}`);
  await page.getByRole("button", { name: "Save this animal" }).click();
  await expect(page.getByText(`Saved ${animal.name}`, { exact: true })).toBeVisible({ timeout: 30_000 });
}

async function addNoteThroughUi(page: Page, animal: Animal, note: string) {
  await page.goto("/discoveries");
  const c = card(page, animal.name);
  await c.getByRole("button", { name: `Add private note for ${animal.name}` }).click();
  await c.getByLabel("Private note (only you can see this)").fill(note);
  await c.getByRole("button", { name: "Save note" }).click();
  await expect(c.getByText(note)).toBeVisible({ timeout: 30_000 });
}

test("two signed-in users keep separate saved animals and private notes", async ({ browser, request }) => {
  const emailA = requireEnv("E2E_USER_A_EMAIL");
  const emailB = requireEnv("E2E_USER_B_EMAIL");
  let a: TestUser | undefined;
  let b: TestUser | undefined;
  // Only rows this test created are ever deleted.
  const created: { a?: Animal; b?: Animal } = {};

  try {
    // 1. Two real Clerk sessions in two separate browser contexts.
    a = await signInAs(browser, emailA);
    b = await signInAs(browser, emailB);
    const idA = userIdFromToken(await getToken(a.page));
    const idB = userIdFromToken(await getToken(b.page));
    expect(idA, "User A and User B must be different Clerk users").not.toBe(idB);

    // 2. Choose test animals that neither user already has in their real collection.
    const taken = new Set([...(await savedTaxonIds(a, request)), ...(await savedTaxonIds(b, request))]);
    const animalB = pickAnimal(6930, taken);
    const animalA = pickAnimal(42069, taken, [animalB.id]);
    console.log(`Test animals: User A saves "${animalA.name}", User B saves "${animalB.name}"`);
    const noteA = `E2E private note A ${Date.now()}`;
    const noteB = `E2E private note B ${Date.now()}`;

    // 3. Each user saves a different animal through the real FERA interface.
    await test.step("User A saves their animal and adds a private note", async () => {
      created.a = animalA;
      await saveAnimalThroughUi(a!.page, animalA);
      await addNoteThroughUi(a!.page, animalA, noteA);
    });
    await test.step("User B saves their animal and adds a private note", async () => {
      created.b = animalB;
      await saveAnimalThroughUi(b!.page, animalB);
      await addNoteThroughUi(b!.page, animalB, noteB);
    });

    // 4. Each user's My Discoveries shows only their own animal and note.
    await test.step("User A sees only User A's discoveries", async () => {
      await a!.page.goto("/discoveries");
      await expect(card(a!.page, animalA.name)).toBeVisible();
      await expect(card(a!.page, animalB.name), "User A must not see User B's animal").toHaveCount(0);
      await expect(a!.page.locator("body"), "User A must not see User B's private note").not.toContainText(noteB);
    });
    await test.step("User B sees only User B's discoveries", async () => {
      await b!.page.goto("/discoveries");
      await expect(card(b!.page, animalB.name)).toBeVisible();
      await expect(card(b!.page, animalA.name), "User B must not see User A's animal").toHaveCount(0);
      await expect(b!.page.locator("body"), "User B must not see User A's private note").not.toContainText(noteA);
    });

    // 5. Saved animals and notes persist after a refresh.
    await test.step("Saved discoveries persist after refreshing", async () => {
      await a!.page.reload();
      await expect(card(a!.page, animalA.name)).toBeVisible();
      await expect(a!.page.getByText(noteA)).toBeVisible();
      await b!.page.reload();
      await expect(card(b!.page, animalB.name)).toBeVisible();
      await expect(b!.page.getByText(noteB)).toBeVisible();
    });

    // 6. Direct attacks with User B's real token against the real table.
    await test.step("User B cannot read, change, delete or forge User A's data", async () => {
      await assertIsolation(request, {
        table: "saved_species",
        tokenA: () => getToken(a!.page),
        tokenB: () => getToken(b!.page),
        taxonA: animalA.id,
        taxonB: animalB.id,
        noteA,
      });
    });

    // 7. A signed-out visitor can't reach My Discoveries.
    await test.step("A signed-out visitor is sent to sign-in", async () => {
      const anonymous = await browser.newContext();
      const page = await anonymous.newPage();
      await page.goto("/discoveries");
      await expect(page).toHaveURL(/sign-in/);
      await anonymous.close();
    });
  } finally {
    // Remove only the rows this test created, each through the owner's own session.
    for (const [user, animal] of [
      [a, created.a],
      [b, created.b],
    ] as const) {
      if (!user || !animal) continue;
      try {
        await rest(request, await getToken(user.page), "DELETE", `saved_species?taxon_id=eq.${animal.id}`);
      } catch (error) {
        console.error(`Cleanup failed for ${animal.name}; remove it from My Discoveries by hand.`, error);
      }
    }
    await a?.context.close();
    await b?.context.close();
  }
});

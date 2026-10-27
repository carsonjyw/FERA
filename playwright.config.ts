import { defineConfig, devices } from "@playwright/test";

// The test process reads the same .env.local the app uses (Clerk keys, Supabase
// URL and publishable key). Nothing from it is printed or written anywhere.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: the specs fail with a clear message about missing variables
}

const PORT = 3100; // not 3000, so it never collides with `npm run dev`
// Set E2E_BASE_URL (e.g. the Vercel URL) to run the same tests against a deployed site instead.
const DEPLOYED_URL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: DEPLOYED_URL ?? `http://localhost:${PORT}`,
    // Traces and videos record request headers, which would include real tokens.
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: DEPLOYED_URL
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 240_000,
      },
});

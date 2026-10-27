import { defineConfig, devices } from "@playwright/test";

// The test process reads the same .env.local the app uses (Clerk keys, Supabase
// URL and publishable key). Nothing from it is printed or written anywhere.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: the specs fail with a clear message about missing variables
}

const PORT = 3100; // not 3000, so it never collides with `npm run dev`

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Traces and videos record request headers, which would include real tokens.
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});

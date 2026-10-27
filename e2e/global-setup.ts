import { clerkSetup } from "@clerk/testing/playwright";

// Gets a Clerk "testing token" so sign-in isn't blocked by bot detection.
// Uses CLERK_SECRET_KEY / the publishable key from the environment (.env.local).
export default async function globalSetup() {
  await clerkSetup();
}

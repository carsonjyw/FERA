# Deploying FERA to Vercel (Hobby plan)

## 1. Get the code onto `main`

Vercel deploys the repository's `main` branch. The work lives on step branches, so push the Step 8 branch, open a pull request, and merge it (this is also where the assignment's "work on a branch, review, then merge" happens):

```bash
git push -u origin step-8-deploy
```

On GitHub, open a pull request from `step-8-deploy` into `main`, read the changes, and merge it.

## 2. Create the Vercel project

1. Sign in at https://vercel.com with GitHub, using the **free Hobby plan** (do not add a payment method).
2. **Add New, then Project**, and import `carsonjyw/FERA`.
3. Leave the framework as **Next.js** (auto-detected), the root directory as `./`, and the build settings as the defaults.
4. Under **Environment Variables**, add these four for **Production, Preview and Development**. You enter them yourself; never paste them into a chat. The values are the same ones in your local `.env.local` (you can use Vercel's *Import .env* box and paste that file's contents there):

   | Name | Public? |
   |---|---|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (publishable) |
   | `CLERK_SECRET_KEY` | **Secret** |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes (publishable). **Never use the Supabase secret key.** |

   - Also copy any other `NEXT_PUBLIC_CLERK_*` lines that exist in your `.env.local` (for example the sign-in and sign-up URLs).
   - **Do not add `INAT_API_BASE`.** It exists only to test the "API unavailable" state.
   - These values are read when the app is built, so they must be set **before** the first deploy.
5. Click **Deploy**. When it finishes, copy the live URL (`https://<project>.vercel.app`).

## 3. If sign-in doesn't work on the live URL

Clerk is on its development instance, as the course requires, and normally works on any domain. If sign-in or sign-up fails, check the browser's address bar for an error, and in the Clerk dashboard look for an *allowed origins / domains* setting for your Vercel URL. Then tell your agent what you see.

## 4. Production checks

**Automated (run by the agent against the live URL, without touching your data):**
- Homepage, search and group pages return 200 and show real wildlife
- Animal and sighting pages load, and invalid IDs show the not-found page
- The empty-search message appears for a nonsense query
- Security headers are present
- Signed-out `/discoveries` redirects to sign-in and contains no private data
- The Playwright two-user test passes against the live site (`E2E_BASE_URL=<live-url>`), including real Clerk sign-ins, saving, notes, isolation and cleanup

**Manual (you):**
- [ ] Sign up with a new test email (or Google), and see "My Discoveries" in the header
- [ ] Save an animal (♡ on a card, and "Save this animal" on its page) and a sighting
- [ ] Open My Discoveries, add a private note, refresh, and check the note is still there
- [ ] Remove an item (check the "Remove?" prompt), then sign out and back in
- [ ] Check the site on your phone
- [ ] Have a classmate create an account and use it (see [PEER_USABILITY_TEST.md](PEER_USABILITY_TEST.md))

## 5. Free tier and usage limits

| Service | Limit to know | What to do |
|---|---|---|
| Vercel Hobby | Free, non-commercial; paused if limits are exceeded | Don't add a card. Check *Usage* in the dashboard. |
| Supabase Free | The project **pauses after a week without use** | Open the live site once in a while until grades are back |
| Clerk (development) | Dev keys only; "Development mode" banner shown | Keep dev keys (the course requires it) |
| iNaturalist | About 60 requests per minute | FERA caches responses on the server |

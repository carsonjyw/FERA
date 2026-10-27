import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client for Server Components, Route Handlers, and Server Actions.
// Each request carries the signed-in user's Clerk session token, so RLS sees
// their Clerk user ID as auth.jwt()->>'sub'. Signed out, there is no token and
// the request runs as anon, which has no access to FERA's tables.
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
}

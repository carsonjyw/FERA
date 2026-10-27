"use client";

import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

// Supabase client for Client Components. Same idea as the server client:
// every request sends the current Clerk session token (or none when signed out).
export function useSupabaseClient() {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          async accessToken() {
            return (await session?.getToken()) ?? null;
          },
        },
      ),
    [session],
  );
}

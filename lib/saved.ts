import { auth } from "@clerk/nextjs/server";
import { connection } from "next/server";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SavedIds = { species: Set<number>; observations: Set<number> };

// IDs of everything the signed-in user has saved, or null when signed out.
// Used to show filled/empty hearts and the count in the header. RLS limits both
// queries to the caller's own rows. React's cache() makes this one lookup per
// request, however many components ask. Call it inside <Suspense>.
export const getSavedIds = cache(async (): Promise<SavedIds | null> => {
  // Never read per-user data while Next.js is prerendering a cached page in the
  // background: wait for a real request first.
  await connection();
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return null;

  const supabase = createServerSupabaseClient();
  const [species, observations] = await Promise.all([
    supabase.from("saved_species").select("taxon_id"),
    supabase.from("saved_observations").select("observation_id"),
  ]);
  if (species.error || observations.error) {
    // Show everything as unsaved rather than breaking the page. A save click
    // still works (duplicates are treated as success).
    console.error("[getSavedIds]", species.error ?? observations.error);
    return { species: new Set(), observations: new Set() };
  }
  return {
    species: new Set(species.data.map((r) => r.taxon_id as number)),
    observations: new Set(observations.data.map((r) => Number(r.observation_id))),
  };
});

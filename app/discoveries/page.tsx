import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Protected: signed-out visitors are redirected to /sign-in before anything renders.
export default async function DiscoveriesPage() {
  const { userId } = await auth.protect();

  // No user_id filter needed for security: RLS only returns the signed-in user's rows.
  const supabase = createServerSupabaseClient();
  const [species, observations] = await Promise.all([
    supabase.from("saved_species").select("*", { count: "exact", head: true }),
    supabase.from("saved_observations").select("*", { count: "exact", head: true }),
  ]);
  const error = species.error ?? observations.error;

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">My Discoveries</h1>
      {error ? (
        <p role="alert">Couldn&apos;t load your saved discoveries. Please try again later.</p>
      ) : (
        <p>
          Saved species: {species.count ?? 0} · Saved sightings: {observations.count ?? 0}
        </p>
      )}
      <p className="text-sm text-zinc-500">
        Signed in as <code>{userId}</code>
      </p>
    </main>
  );
}

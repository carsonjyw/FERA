import { auth } from "@clerk/nextjs/server";

// Protected: signed-out visitors are redirected to /sign-in before anything renders.
export default async function DiscoveriesPage() {
  const { userId } = await auth.protect();

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">My Discoveries</h1>
      <p>
        Your saved species and sightings will appear here once the database is
        connected (Step 5).
      </p>
      <p className="text-sm text-zinc-500">
        Signed in as <code>{userId}</code>
      </p>
    </main>
  );
}

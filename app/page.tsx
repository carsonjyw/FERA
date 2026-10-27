import { Show, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

// Placeholder home page. Wildlife search (iNaturalist) comes in a later step.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">FERA</h1>
      <p>Discover and save real wildlife from around the world.</p>
      <Suspense>
        <Show
          when="signed-in"
          fallback={
            <p>
              <SignInButton>
                <button className="underline">Sign in</button>
              </SignInButton>{" "}
              to see your saved discoveries.
            </p>
          }
        >
          <p>
            <Link href="/discoveries" className="underline">
              Go to My Discoveries
            </Link>
          </p>
        </Show>
      </Suspense>
    </main>
  );
}

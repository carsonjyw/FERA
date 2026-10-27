import Link from "next/link";
import { getSavedIds } from "@/lib/saved";
import { HeartIcon } from "./icons";

// Header link to the personal collection, with a count so it reads as a
// destination that holds something. Shown only to signed-in users.
export function DiscoveriesLinkBase({ count = 0 }: { count?: number }) {
  return (
    <Link href="/discoveries" className="inline-flex min-h-11 items-center gap-1.5 font-semibold hover:text-accent">
      <HeartIcon className="h-4 w-4 text-accent" filled={count > 0} />
      My Discoveries
      {count > 0 && (
        <span
          aria-label={`${count} saved`}
          className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold leading-none text-accent-ink"
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export async function DiscoveriesLink() {
  const ids = await getSavedIds();
  return <DiscoveriesLinkBase count={ids ? ids.species.size + ids.observations.size : 0} />;
}

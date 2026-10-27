import Link from "next/link";
import { SearchForm } from "@/components/search-form";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Not found</p>
      <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">This trail goes cold</h1>
      <p className="mt-3 text-muted">
        We couldn&apos;t find that animal or sighting. It may have been removed from iNaturalist, or the link is
        incorrect.
      </p>
      <div className="mt-8">
        <SearchForm />
      </div>
      <Link href="/" className="mt-6 inline-block text-accent underline">
        Back to the atlas
      </Link>
    </main>
  );
}

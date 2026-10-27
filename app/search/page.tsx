import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SpeciesCard } from "@/components/cards";
import { GroupChips } from "@/components/group-chips";
import { SearchForm } from "@/components/search-form";
import { ApiUnavailable, EmptyState, SkeletonGrid } from "@/components/states";
import { MAX_QUERY, MIN_QUERY, searchSpecies } from "@/lib/inaturalist";
import { getSavedIds } from "@/lib/saved";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black uppercase tracking-tight">Search animals</h1>
      <Suspense fallback={<SearchBody q="" loading />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function normalize(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").replace(/\s+/g, " ").trim();
}

async function SearchResults({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const q = normalize((await searchParams).q);
  return <SearchBody q={q} />;
}

async function SearchBody({ q, loading }: { q: string; loading?: boolean }) {
  return (
    <>
      <div className="mt-6 max-w-2xl">
        <SearchForm defaultValue={q} autoFocus={!q} key={q} />
      </div>
      <div className="mt-8">
        {loading ? (
          <SkeletonGrid count={8} label="Searching" />
        ) : (
          <Suspense key={q} fallback={<SkeletonGrid count={8} label="Searching" />}>
            <Results q={q} />
          </Suspense>
        )}
      </div>
    </>
  );
}

async function Results({ q }: { q: string }) {
  if (!q) {
    return (
      <EmptyState title="What would you like to find?">
        <p>Search by common name (&ldquo;snow leopard&rdquo;) or scientific name (&ldquo;Panthera&rdquo;), or browse a group:</p>
        <div className="mt-4 flex justify-center">
          <GroupChips />
        </div>
      </EmptyState>
    );
  }
  if (q.length < MIN_QUERY) {
    return <EmptyState title="Keep typing">Enter at least {MIN_QUERY} letters to search.</EmptyState>;
  }
  if (q.length > MAX_QUERY) {
    return <EmptyState title="That search is too long">Try a shorter name, up to {MAX_QUERY} characters.</EmptyState>;
  }

  const [result, saved] = await Promise.all([searchSpecies(q), getSavedIds()]);
  if (result.status === "unavailable") return <ApiUnavailable what="search results" />;
  if (result.status === "not_found") {
    return (
      <EmptyState
        title={`No animals match “${q}”`}
        action={
          <Link href="/" className="rounded-full border border-line px-5 py-2 hover:bg-surface-2">
            See recent sightings
          </Link>
        }
      >
        <ul className="mt-2 space-y-1 text-left">
          <li>• Check the spelling. iNaturalist doesn&apos;t correct typos.</li>
          <li>• Try the start of the name, like &ldquo;owl&rdquo; or &ldquo;Strix&rdquo;.</li>
          <li>• FERA searches animals only, so plants and fungi won&apos;t appear.</li>
        </ul>
      </EmptyState>
    );
  }

  const { total, results } = result.data;
  return (
    <>
      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {total > results.length ? `Top ${results.length} of ${total.toLocaleString()} matches` : `${total} match${total === 1 ? "" : "es"}`}{" "}
        for &ldquo;{q}&rdquo;
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((t, i) => (
          <SpeciesCard key={t.id} taxon={t} eager={i < 8} saved={saved ? saved.species.has(t.id) : null} />
        ))}
      </div>
    </>
  );
}

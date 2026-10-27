import Link from "next/link";
import { Suspense } from "react";
import { Credit, ObservationCard, displayName } from "@/components/cards";
import { GroupChips } from "@/components/group-chips";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { SearchForm } from "@/components/search-form";
import { ApiUnavailable, SkeletonGrid } from "@/components/states";
import { getRecentObservations } from "@/lib/inaturalist";
import { getSavedIds } from "@/lib/saved";

export default function Home() {
  return (
    <main>
      <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-surface motion-safe:animate-pulse" />}>
          <HeroPhoto />
        </Suspense>
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-32 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">A living atlas of wildlife</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Wildlife, seen today, all over the world
          </h1>
          <p className="mt-4 max-w-xl text-lg text-foreground/80">
            Search any animal, browse real photos from people who spotted them, and save your favorites.
          </p>
          <div className="mt-8 max-w-2xl">
            <SearchForm size="lg" />
          </div>
          <p className="mt-6 text-sm text-foreground/70">Or browse by type of animal:</p>
          <div className="mt-2">
            <GroupChips />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-2xl font-black uppercase tracking-tight">
          Recent sightings
        </h2>
        <p className="mt-1 text-muted">
          Each card is one real sighting: a photo someone took, in one place, on one day.
        </p>
        <div className="mt-6">
          <Suspense fallback={<SkeletonGrid count={8} label="Loading recent sightings" />}>
            <RecentSightings />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

// The hero photo is the most recent sighting. If iNaturalist is down, the hero
// simply has no photo; search and groups still work.
async function HeroPhoto() {
  const recent = await getRecentObservations({}, 12);
  const hero = recent.status === "ok" ? recent.data.find((o) => o.photo) : undefined;
  if (!hero) return <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-background" />;
  const name = hero.taxon ? displayName(hero.taxon) : "Wildlife";
  return (
    <>
      <HeroBackdrop photo={hero.photo} alt={`${name}, recently sighted`} />
      <div className="absolute bottom-3 right-4 z-10 max-w-xs text-right sm:right-6">
        <Link href={`/observations/${hero.id}`} className="inline-block py-1 text-sm font-semibold hover:text-accent">
          Photo: {name} →
        </Link>
        <Credit photo={hero.photo} />
      </div>
    </>
  );
}

async function RecentSightings() {
  const [recent, saved] = await Promise.all([getRecentObservations({}, 12), getSavedIds()]);
  if (recent.status === "unavailable") return <ApiUnavailable what="recent sightings" />;
  if (recent.status === "not_found") return <p className="text-muted">No recent sightings right now.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {recent.data.map((o, i) => (
        <ObservationCard key={o.id} obs={o} eager={i < 8} saved={saved ? saved.observations.has(o.id) : null} />
      ))}
    </div>
  );
}

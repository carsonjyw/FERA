import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Credit, ObservationCard, WildlifePhoto, displayName } from "@/components/cards";
import { ExpandableText } from "@/components/expandable-text";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { SavedStatus } from "@/components/saved-status";
import { ApiUnavailable, DetailSkeleton, EmptyState, SkeletonGrid } from "@/components/states";
import { groupLabel, groupSlug, rankLabel } from "@/lib/groups";
import { getRecentObservations, getSpecies, parseId } from "@/lib/inaturalist";
import { getSavedIds } from "@/lib/saved";

export default function SpeciesPage({ params }: PageProps<"/species/[id]">) {
  return (
    <main>
      <Suspense fallback={<DetailSkeleton />}>
        <Species params={params} />
      </Suspense>
    </main>
  );
}

async function Species({ params }: { params: PageProps<"/species/[id]">["params"] }) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const result = await getSpecies(id);
  if (result.status === "not_found") notFound();
  if (result.status === "unavailable") {
    return (
      <>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Animal" }]} />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <ApiUnavailable what="this animal" />
        </div>
      </>
    );
  }

  const t = result.data;
  const name = displayName(t);
  const label = groupLabel(t.group);
  const slug = groupSlug(t.group);
  const gallery = t.photos.filter((p) => p.url !== t.photo?.url).slice(0, 6);
  const status = t.extinct ? "Extinct" : t.conservationStatus;

  return (
    <article>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(label && slug ? [{ label, href: `/explore/${slug}` }] : []),
          { label: name },
        ]}
      />
      <header className="relative isolate mt-4 flex min-h-[55vh] items-end overflow-hidden">
        <HeroBackdrop photo={t.photo} alt={name} />
        <div className="relative mx-auto w-full max-w-5xl px-4 pb-8 pt-40 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            Animal{label ? ` · ${label}` : ""}
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">{name}</h1>
          <p className="mt-2 text-xl italic text-muted">{t.name}</p>
          <p className="mt-3 max-w-xl text-foreground/80">
            Everything about this animal. The sightings further down are individual photos people have shared.
          </p>
          <div className="mt-6">
            <Suspense fallback={<div className="h-11 w-48 rounded-full bg-white/10" />}>
              <SavedStatus kind="species" id={t.id} label={name} />
            </Suspense>
          </div>
          <Credit photo={t.photo} className="mt-4" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          <Fact label="Sightings recorded" value={t.observationsCount.toLocaleString()} />
          <Fact label="Type" value={rankLabel(t.rank)} />
          {label && <Fact label="Group" value={label} />}
          {status && <Fact label="Conservation status" value={status} />}
        </dl>

        <section className="mt-10 max-w-3xl">
          <h2 className="text-xl font-bold uppercase tracking-tight">About</h2>
          <div className="mt-3">
            {t.summary ? (
              <ExpandableText text={t.summary} />
            ) : (
              <p className="text-muted">iNaturalist doesn&apos;t have a summary for this animal yet.</p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {t.wikipediaUrl && (
              <a
                href={t.wikipediaUrl}
                className="inline-flex min-h-10 items-center rounded-full px-4 ring-1 ring-white/25 hover:bg-white/10"
                target="_blank"
                rel="noreferrer"
              >
                Read more on Wikipedia ↗
              </a>
            )}
            <a
              href={`https://www.inaturalist.org/taxa/${t.id}`}
              className="inline-flex min-h-10 items-center rounded-full px-4 ring-1 ring-white/25 hover:bg-white/10"
              target="_blank"
              rel="noreferrer"
            >
              View on iNaturalist ↗
            </a>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="sightings-heading">
          <h2 id="sightings-heading" className="text-xl font-bold uppercase tracking-tight">
            Recent sightings of this animal
          </h2>
          <p className="mt-1 text-muted">Each card is one photo someone took, in one place, on one day.</p>
          <div className="mt-4">
            <Suspense fallback={<SkeletonGrid count={4} label="Loading sightings" />}>
              <SpeciesSightings taxonId={t.id} name={name} />
            </Suspense>
          </div>
        </section>

        {gallery.length > 0 && (
          <section className="mt-12" aria-labelledby="photos-heading">
            <h2 id="photos-heading" className="text-xl font-bold uppercase tracking-tight">
              More photos
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((p) => (
                <li key={p.url}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2">
                    <WildlifePhoto photo={p} alt={`${name} photo`} sizes="(min-width: 640px) 33vw, 50vw" />
                  </div>
                  <Credit photo={p} className="mt-1" />
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12">
          <Link href={slug ? `/explore/${slug}` : "/"} className="text-accent underline">
            ← Back to {label ? label.toLowerCase() : "the atlas"}
          </Link>
        </p>
      </div>
    </article>
  );
}

async function SpeciesSightings({ taxonId, name }: { taxonId: number; name: string }) {
  const [result, saved] = await Promise.all([getRecentObservations({ taxonId }, 8), getSavedIds()]);
  if (result.status === "unavailable") return <ApiUnavailable what="recent sightings" />;
  if (result.status === "not_found") {
    return (
      <EmptyState title="No verified sightings with photos yet">
        Nobody has shared a confirmed photo of {name} recently.
      </EmptyState>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {result.data.map((o, i) => (
        <ObservationCard key={o.id} obs={o} eager={i < 8} saved={saved ? saved.observations.has(o.id) : null} />
      ))}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 font-semibold capitalize">{value}</dd>
    </div>
  );
}

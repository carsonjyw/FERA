import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Credit, WildlifePhoto, displayName, formatDate } from "@/components/cards";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { SavedStatus } from "@/components/saved-status";
import { ApiUnavailable, DetailSkeleton } from "@/components/states";
import { getObservation, parseId } from "@/lib/inaturalist";

export default function ObservationPage({ params }: PageProps<"/observations/[id]">) {
  return (
    <main>
      <Suspense fallback={<DetailSkeleton />}>
        <Observation params={params} />
      </Suspense>
    </main>
  );
}

async function Observation({ params }: { params: PageProps<"/observations/[id]">["params"] }) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const result = await getObservation(id);
  if (result.status === "not_found") notFound();
  if (result.status === "unavailable") {
    return (
      <>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Sighting" }]} />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <ApiUnavailable what="this sighting" />
        </div>
      </>
    );
  }

  const o = result.data;
  const name = o.taxon ? displayName(o.taxon) : "Unidentified animal";
  const [main, ...rest] = o.photos;
  const when = formatDate(o.observedOn);

  return (
    <article>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(o.taxon ? [{ label: name, href: `/species/${o.taxon.id}` }] : []),
          { label: "Sighting" },
        ]}
      />
      <header className="relative isolate mt-4 flex min-h-[55vh] items-end overflow-hidden">
        <HeroBackdrop photo={main ?? null} alt={`${name} sighting`} />
        <div className="relative mx-auto w-full max-w-5xl px-4 pb-8 pt-40 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">One sighting</p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">{name}</h1>
          {o.taxon && <p className="mt-2 text-xl italic text-muted">{o.taxon.name}</p>}
          <p className="mt-3 max-w-xl text-foreground/80">
            A single photo someone shared
            {o.placeGuess ? ` from ${o.placeGuess}` : ""}
            {when ? ` on ${when}` : ""}.
          </p>
          <div className="mt-6">
            <Suspense fallback={<div className="h-11 w-48 rounded-full bg-white/10" />}>
              <SavedStatus kind="observation" id={o.id} label={`${name} sighting`} />
            </Suspense>
          </div>
          <Credit photo={main ?? null} className="mt-4" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
            <dt className="text-xs uppercase tracking-wider text-muted">Seen on</dt>
            <dd className="mt-1 font-semibold">{when ?? "Date not recorded"}</dd>
          </div>
          <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
            <dt className="text-xs uppercase tracking-wider text-muted">Where</dt>
            <dd className="mt-1 font-semibold">{o.placeGuess ?? "Location not shared"}</dd>
            {o.locationObscured && (
              <dd className="mt-1 text-xs text-muted">
                Approximate. The exact location is hidden to protect this animal or the observer.
              </dd>
            )}
          </div>
          <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
            <dt className="text-xs uppercase tracking-wider text-muted">Photographed by</dt>
            <dd className="mt-1 font-semibold">{o.observer ?? "Unknown"}</dd>
            <dd className="mt-1 text-xs text-muted">
              {o.qualityGrade === "research"
                ? "Animal identification confirmed by the community"
                : "Animal identification not yet confirmed"}
            </dd>
          </div>
        </dl>

        {o.description && (
          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-bold uppercase tracking-tight">Photographer&apos;s notes</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">{o.description}</p>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {o.taxon && (
            <Link
              href={`/species/${o.taxon.id}`}
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-ink hover:brightness-110"
            >
              See everything about {name} →
            </Link>
          )}
          <a
            href={o.uri}
            className="inline-flex min-h-11 items-center rounded-full px-5 ring-1 ring-white/25 hover:bg-white/10"
            target="_blank"
            rel="noreferrer"
          >
            View on iNaturalist ↗
          </a>
        </div>

        {rest.length > 0 && (
          <section className="mt-12" aria-labelledby="more-photos">
            <h2 id="more-photos" className="text-xl font-bold uppercase tracking-tight">
              More photos from this sighting
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rest.slice(0, 6).map((p) => (
                <li key={p.url}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2">
                    <WildlifePhoto photo={p} alt={`${name} sighting photo`} sizes="(min-width: 640px) 33vw, 50vw" />
                  </div>
                  <Credit photo={p} className="mt-1" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

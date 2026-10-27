import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/components/cards";
import { NoteEditor, RemoveButton } from "@/components/saved-item-controls";
import { EmptyState } from "@/components/states";
import { groupLabel } from "@/lib/groups";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My Discoveries" };

type SavedSpecies = {
  taxon_id: number;
  common_name: string | null;
  scientific_name: string;
  iconic_group: string | null;
  photo_url: string | null;
  photo_attribution: string | null;
  note: string | null;
  created_at: string;
};

type SavedObservation = {
  observation_id: number;
  common_name: string | null;
  photo_url: string | null;
  photo_attribution: string | null;
  observed_on: string | null;
  place_guess: string | null;
  observer_login: string | null;
  note: string | null;
  created_at: string;
};

// Protected: signed-out visitors are redirected to /sign-in before anything renders.
// Reads only from Supabase (the saved snapshots), so it works even if iNaturalist is down.
export default async function DiscoveriesPage({ searchParams }: PageProps<"/discoveries">) {
  await auth.protect();
  const tab = (await searchParams).tab === "sightings" ? "sightings" : "species";

  // No user_id filter needed for security: RLS only returns the signed-in user's rows.
  const supabase = createServerSupabaseClient();
  const [species, sightings] = await Promise.all([
    supabase.from("saved_species").select("*").order("created_at", { ascending: false }),
    supabase.from("saved_observations").select("*").order("created_at", { ascending: false }),
  ]);
  const error = species.error ?? sightings.error;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Your collection</p>
      <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">My Discoveries</h1>
      <p className="mt-2 max-w-xl text-muted">
        <strong className="font-semibold text-foreground">Animals</strong> are kinds of animals you want to remember.{" "}
        <strong className="font-semibold text-foreground">Sightings</strong> are single photos you saved. Your notes are
        private to you.
      </p>
      <p className="mt-3">
        <Link href="/" className="inline-flex min-h-10 items-center text-accent underline">
          ← Keep exploring
        </Link>
      </p>

      {error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
          <p className="text-lg font-semibold">We couldn&apos;t load your collection</p>
          <p className="mt-2 text-muted">Your saved items are safe. Please refresh the page in a moment.</p>
        </div>
      ) : (
        <>
          <nav aria-label="Collection" className="mt-6 flex gap-2 border-b border-line">
            <Tab href="/discoveries" active={tab === "species"} label="Animals" count={species.data?.length ?? 0} />
            <Tab
              href="/discoveries?tab=sightings"
              active={tab === "sightings"}
              label="Sightings"
              count={sightings.data?.length ?? 0}
            />
          </nav>
          <div className="mt-8">
            {tab === "species" ? (
              <SpeciesList items={(species.data ?? []) as SavedSpecies[]} />
            ) : (
              <SightingList items={(sightings.data ?? []) as SavedObservation[]} />
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Tab({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 px-4 py-2 font-semibold ${
        active ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {label} <span className="text-muted">({count})</span>
    </Link>
  );
}

function SpeciesList({ items }: { items: SavedSpecies[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No animals saved yet"
        action={
          <Link href="/explore/mammals" className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-accent-ink">
            Start exploring
          </Link>
        }
      >
        Open any animal and tap <span className="text-foreground">Save this animal</span>, or tap the ♡ on its card, to keep it here.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => {
        const name = s.common_name ?? s.scientific_name;
        return (
          <li key={s.taxon_id} className="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
            <SnapshotPhoto url={s.photo_url} alt={name} href={`/species/${s.taxon_id}`} />
            <div className="p-4">
              <Link href={`/species/${s.taxon_id}`} className="text-lg font-bold hover:text-accent">
                {name}
              </Link>
              <p className="text-sm italic text-muted">{s.scientific_name}</p>
              <p className="mt-1 text-xs text-muted">
                {[groupLabel(s.iconic_group), `Saved ${formatDate(s.created_at.slice(0, 10))}`].filter(Boolean).join(" · ")}
              </p>
              {s.photo_attribution && <p className="mt-1 text-xs text-muted">{s.photo_attribution}</p>}
              <NoteEditor kind="species" id={s.taxon_id} initialNote={s.note} label={name} />
              <div className="mt-3 border-t border-line pt-3">
                <RemoveButton kind="species" id={s.taxon_id} label={name} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SightingList({ items }: { items: SavedObservation[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No sightings saved yet"
        action={
          <Link href="/" className="rounded-full bg-accent px-5 py-2 font-semibold text-accent-ink">
            See recent sightings
          </Link>
        }
      >
        Open any sighting and tap <span className="text-foreground">Save this sighting</span>, or tap the ♡ on its card, to keep that moment here.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((o) => {
        const name = o.common_name ?? "Unidentified animal";
        return (
          <li key={o.observation_id} className="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
            <SnapshotPhoto url={o.photo_url} alt={`${name} sighting`} href={`/observations/${o.observation_id}`} />
            <div className="p-4">
              <Link href={`/observations/${o.observation_id}`} className="text-lg font-bold hover:text-accent">
                {name}
              </Link>
              <p className="mt-1 text-sm text-muted">
                {[o.place_guess ?? "Location not shared", formatDate(o.observed_on)].filter(Boolean).join(" · ")}
              </p>
              {o.observer_login && <p className="text-xs text-muted">Seen by {o.observer_login}</p>}
              {o.photo_attribution && <p className="mt-1 text-xs text-muted">{o.photo_attribution}</p>}
              <NoteEditor kind="observation" id={o.observation_id} initialNote={o.note} label={`${name} sighting`} />
              <div className="mt-3 border-t border-line pt-3">
                <RemoveButton kind="observation" id={o.observation_id} label={`${name} sighting`} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SnapshotPhoto({ url, alt, href }: { url: string | null; alt: string; href: string }) {
  return (
    <Link href={href} className="relative block aspect-[4/3] bg-surface-2" tabIndex={-1} aria-hidden={!url}>
      {url ? (
        <Image src={url} alt={alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-sm text-muted">No photo</span>
      )}
    </Link>
  );
}

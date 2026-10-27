import Link from "next/link";
import { groupLabel, rankLabel } from "@/lib/groups";
import type { ObservationSummary, Photo, TaxonSummary } from "@/lib/inaturalist";
import { HeartButton } from "./save-button";
import { WildlifePhoto } from "./photo";

export { WildlifePhoto };

export function Credit({ photo, className = "" }: { photo: Photo | null; className?: string }) {
  if (!photo) return null;
  return <p className={`text-xs text-muted ${className}`}>{photo.attribution}</p>;
}

export function displayName(t: { commonName: string | null; name: string }) {
  return t.commonName ?? t.name;
}

// Tells people what kind of thing a card is: a kind of animal, or one sighting.
function TypeChip({ children }: { children: string }) {
  return (
    <span className="absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
      {children}
    </span>
  );
}

const CARD =
  "group relative overflow-hidden rounded-xl bg-surface ring-1 ring-line transition hover:ring-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent";

// `saved` is true/false when signed in, or null when signed out.
export function SpeciesCard({
  taxon,
  count,
  saved,
  eager,
}: {
  taxon: TaxonSummary;
  count?: number;
  saved: boolean | null;
  eager?: boolean;
}) {
  const label = groupLabel(taxon.group);
  const name = displayName(taxon);
  return (
    <div className={CARD}>
      <Link href={`/species/${taxon.id}`} className="block focus-visible:outline-none">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          <WildlifePhoto
            photo={taxon.photo}
            alt={name}
            eager={eager}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="transition duration-500 motion-safe:group-hover:scale-105"
          />
          <TypeChip>Animal</TypeChip>
        </div>
        <div className="p-3">
          <p className="font-semibold leading-tight">{name}</p>
          <p className="mt-0.5 text-sm italic text-muted">{taxon.name}</p>
          <p className="mt-1 text-xs text-muted">
            {[label, taxon.rank !== "species" ? rankLabel(taxon.rank) : null, count ? `${count.toLocaleString()} sightings` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </Link>
      <HeartButton kind="species" id={taxon.id} saved={saved} label={name} />
    </div>
  );
}

export function ObservationCard({ obs, saved, eager }: { obs: ObservationSummary; saved: boolean | null; eager?: boolean }) {
  const name = obs.taxon ? displayName(obs.taxon) : "Unidentified animal";
  return (
    <div className={CARD}>
      <Link href={`/observations/${obs.id}`} className="block focus-visible:outline-none">
        <div className="relative aspect-square overflow-hidden bg-surface-2">
          <WildlifePhoto
            photo={obs.photo}
            alt={`${name} sighting`}
            eager={eager}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="transition duration-500 motion-safe:group-hover:scale-105"
          />
          <TypeChip>Sighting</TypeChip>
        </div>
        <div className="p-3">
          <p className="font-semibold leading-tight">{name}</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted">
            {[obs.placeGuess ?? "Location not shared", formatDate(obs.observedOn)].filter(Boolean).join(" · ")}
          </p>
        </div>
      </Link>
      <HeartButton kind="observation" id={obs.id} saved={saved} label={`${name} sighting`} />
    </div>
  );
}

export function formatDate(date: string | null) {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

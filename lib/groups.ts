// Animal groups FERA lets people browse, mapped to iNaturalist's iconic taxa.
export const GROUPS = [
  { slug: "birds", iconic: "Aves", label: "Birds" },
  { slug: "mammals", iconic: "Mammalia", label: "Mammals" },
  { slug: "reptiles", iconic: "Reptilia", label: "Reptiles" },
  { slug: "amphibians", iconic: "Amphibia", label: "Amphibians" },
  { slug: "fish", iconic: "Actinopterygii", label: "Fish" },
  { slug: "insects", iconic: "Insecta", label: "Insects" },
  { slug: "arachnids", iconic: "Arachnida", label: "Arachnids" },
  { slug: "mollusks", iconic: "Mollusca", label: "Mollusks" },
] as const;

export type Group = (typeof GROUPS)[number];

export function groupBySlug(slug: string): Group | undefined {
  return GROUPS.find((g) => g.slug === slug);
}

// Human label for an iconic taxon name from the API ("Aves" -> "Birds").
export function groupLabel(iconic: string | null | undefined): string | null {
  if (!iconic) return null;
  return GROUPS.find((g) => g.iconic === iconic)?.label ?? iconic;
}

export function groupSlug(iconic: string | null | undefined): string | null {
  if (!iconic) return null;
  return GROUPS.find((g) => g.iconic === iconic)?.slug ?? null;
}

// Plain-language names for taxonomic ranks, so people don't need to know "genus".
export function rankLabel(rank: string): string {
  switch (rank) {
    case "species":
      return "Species";
    case "subspecies":
      return "Variety (subspecies)";
    case "genus":
      return "Group of related animals (genus)";
    case "family":
      return "Animal family";
    case "order":
      return "Animal order";
    default:
      return rank ? rank.charAt(0).toUpperCase() + rank.slice(1) : "Unknown";
  }
}

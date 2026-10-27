import { cacheLife } from "next/cache";

// All iNaturalist calls happen on FERA's server (Server Components and Server
// Actions), never in the browser. Responses are cached and shared between
// visitors, which keeps us well under iNaturalist's ~60 requests/minute guidance.

// Overridable only to test the "API unavailable" state locally (set it in the
// shell when starting the dev server, e.g. INAT_API_BASE=http://127.0.0.1:9).
const BASE = process.env.INAT_API_BASE ?? "https://api.inaturalist.org/v1";
const ANIMALIA = "1"; // FERA is about animals: limit search to kingdom Animalia
const TIMEOUT_MS = 8000;

export type InatResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_found" }
  | { status: "unavailable" };

export type Photo = {
  url: string; // medium size
  largeUrl: string;
  attribution: string;
  licenseCode: string | null; // null = all rights reserved
};

export type TaxonSummary = {
  id: number;
  name: string; // scientific
  commonName: string | null;
  rank: string;
  group: string | null; // iconic_taxon_name, e.g. "Mammalia"
  photo: Photo | null;
  observationsCount: number;
};

export type TaxonDetail = TaxonSummary & {
  wikipediaUrl: string | null;
  summary: string | null; // plain text
  conservationStatus: string | null;
  extinct: boolean;
  photos: Photo[];
};

export type ObservationSummary = {
  id: number;
  observedOn: string | null;
  placeGuess: string | null;
  locationObscured: boolean;
  observer: string | null;
  taxon: TaxonSummary | null;
  photo: Photo | null;
  qualityGrade: string;
};

export type ObservationDetail = ObservationSummary & {
  uri: string;
  description: string | null;
  photos: Photo[];
};

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

// Cached per (path, params). Failures throw, and thrown errors are not cached,
// so the next request tries iNaturalist again.
async function inatGet(path: string, params: Record<string, string> = {}) {
  "use cache";
  cacheLife("minutes");

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "FERA (MPCS 51238 class project)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`iNaturalist responded ${res.status} for ${path}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await res.json()) as { total_results: number; results: any[] };
}

async function safely<T>(load: () => Promise<InatResult<T>>): Promise<InatResult<T>> {
  try {
    return await load();
  } catch (error) {
    console.error("[iNaturalist]", error);
    return { status: "unavailable" };
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export const MIN_QUERY = 2;
export const MAX_QUERY = 60;

// iNaturalist silently ignores bad parameters, so check IDs ourselves.
export function parseId(value: string | number | undefined | null): number | null {
  const s = String(value ?? "").trim();
  if (!/^\d{1,12}$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && Number.isSafeInteger(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Mapping (keep only what FERA uses)
// ---------------------------------------------------------------------------

// Data from iNaturalist is displayed as links and image sources, so accept only
// http(s) URLs (never javascript:, data:, etc.).
function safeHttpUrl(url: unknown): string | null {
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url : null;
}

function sized(url: string, size: "medium" | "large") {
  return url.replace(/\/(square|thumb|small|medium|large|original)\.(\w+)(\?.*)?$/, `/${size}.$2$3`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPhoto(p: any): Photo | null {
  const url = safeHttpUrl(p?.medium_url ?? p?.url);
  if (!url) return null;
  return {
    url: sized(url, "medium"),
    largeUrl: sized(url, "large"),
    attribution: p.attribution ?? "Photo credit unavailable",
    licenseCode: p.license_code ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTaxonSummary(t: any): TaxonSummary {
  return {
    id: t.id,
    name: t.name,
    commonName: t.preferred_common_name ?? null,
    rank: t.rank ?? "",
    group: t.iconic_taxon_name ?? null,
    photo: toPhoto(t.default_photo),
    observationsCount: t.observations_count ?? 0,
  };
}

function stripHtml(html: string | null | undefined) {
  if (!html) return null;
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
  return text || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toObservationSummary(o: any): ObservationSummary {
  return {
    id: o.id,
    observedOn: o.observed_on ?? null,
    placeGuess: o.place_guess || null,
    locationObscured:
      Boolean(o.obscured) ||
      ["obscured", "private"].includes(o.geoprivacy) ||
      ["obscured", "private"].includes(o.taxon_geoprivacy),
    observer: o.user?.login ?? null,
    taxon: o.taxon ? toTaxonSummary(o.taxon) : null,
    photo: toPhoto(o.photos?.[0]),
    qualityGrade: o.quality_grade ?? "",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function searchSpecies(query: string): Promise<InatResult<{ total: number; results: TaxonSummary[] }>> {
  return safely<{ total: number; results: TaxonSummary[] }>(async () => {
    const data = await inatGet("/taxa/autocomplete", {
      q: query,
      taxon_id: ANIMALIA,
      is_active: "true",
      per_page: "24",
    });
    if (data.total_results === 0) return { status: "not_found" };
    return { status: "ok", data: { total: data.total_results, results: data.results.map(toTaxonSummary) } };
  });
}

export function getSpecies(id: number): Promise<InatResult<TaxonDetail>> {
  return safely<TaxonDetail>(async () => {
    const data = await inatGet(`/taxa/${id}`);
    const t = data.results[0];
    if (!t) return { status: "not_found" };
    const photos = (t.taxon_photos ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((tp: any) => toPhoto(tp.photo))
      .filter(Boolean)
      .slice(0, 8) as Photo[];
    return {
      status: "ok",
      data: {
        ...toTaxonSummary(t),
        wikipediaUrl: safeHttpUrl(t.wikipedia_url),
        summary: stripHtml(t.wikipedia_summary),
        conservationStatus: t.conservation_status?.status_name ?? null,
        extinct: Boolean(t.extinct),
        photos,
      },
    };
  });
}

export function getObservation(id: number): Promise<InatResult<ObservationDetail>> {
  return safely<ObservationDetail>(async () => {
    const data = await inatGet(`/observations/${id}`);
    const o = data.results[0];
    if (!o) return { status: "not_found" };
    return {
      status: "ok",
      data: {
        ...toObservationSummary(o),
        uri: `https://www.inaturalist.org/observations/${o.id}`,
        description: o.description || null,
        photos: (o.photos ?? []).map(toPhoto).filter(Boolean) as Photo[],
      },
    };
  });
}

// Recent research-grade sightings with photos. Optionally for one species or one group.
export function getRecentObservations(
  filter: { taxonId?: number; group?: string } = {},
  perPage = 12,
): Promise<InatResult<ObservationSummary[]>> {
  return safely<ObservationSummary[]>(async () => {
    const params: Record<string, string> = {
      photos: "true",
      quality_grade: "research",
      per_page: String(perPage),
      order_by: "created_at",
    };
    if (filter.taxonId) params.taxon_id = String(filter.taxonId);
    else if (filter.group) params.iconic_taxa = filter.group;
    else params.taxon_id = ANIMALIA;
    const data = await inatGet("/observations", params);
    if (data.total_results === 0) return { status: "not_found" };
    return { status: "ok", data: data.results.map(toObservationSummary) };
  });
}

// Most-observed species in an iconic group (e.g. "Aves").
export function getTopSpecies(group: string): Promise<InatResult<(TaxonSummary & { count: number })[]>> {
  return safely<(TaxonSummary & { count: number })[]>(async () => {
    const data = await inatGet("/observations/species_counts", {
      iconic_taxa: group,
      quality_grade: "research",
      per_page: "24",
    });
    if (data.total_results === 0) return { status: "not_found" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { status: "ok", data: data.results.map((r: any) => ({ ...toTaxonSummary(r.taxon), count: r.count })) };
  });
}

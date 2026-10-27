# Step 1: API Exploration — FERA

Assignment 4 (Full Stack App), Design, Build, Ship · MPCS 51238 · Autumn 2026

> Status: Step 1 complete. No application code, Clerk, Supabase, or database tables yet. Step 2 (data planning) has not started.

---

## 1. Project Overview

**FERA** is a web application where users can discover and explore real wildlife from around the world, search for animals, browse wildlife observations, and save their favorite discoveries to revisit later.

Step 1 of the assignment asks us to choose a tool and an API, have the agent call the API and show one real response, explain what fields come back and which ones the tool needs, and check what happens when a search finds nothing.

## 2. Selected API: iNaturalist

- **Docs:** https://api.inaturalist.org/v1/docs/
- **Base URL:** `https://api.inaturalist.org/v1`
- **Authentication:** none required for reading data (no API key)
- **What it is:** iNaturalist is a citizen-science platform where people upload photos of wildlife they've seen and the community identifies the species. The API exposes species (taxa) and individual sightings (observations).

## 3. Endpoints Explored

| Endpoint | What it gives you | Called during Step 1? |
|---|---|---|
| `/v1/taxa/autocomplete?q=` | Search species by common or scientific name | ✅ |
| `/v1/taxa/{id}` | Details for one species | ✅ (non-existent ID test) |
| `/v1/observations?...` | Real individual sightings: photo, date, place, coordinates, observer. Filters include species, place, date, quality, photo-only | ✅ |
| `/v1/observations/species_counts` | Most-observed species for a filter (e.g. a place + a group) | ✅ |
| `/v1/places/autocomplete` | Look up places to filter by region | Noted from docs, not called |

### Requests made

| # | Request | HTTP | Result |
|---|---|---|---|
| 1 | `GET /v1/taxa/autocomplete?q=red%20fox&per_page=1` | 200 | `total_results: 48`, top match Red Fox |
| 2 | `GET /v1/observations?taxon_name=Vulpes%20vulpes&quality_grade=research&photos=true&per_page=1&order_by=observed_on` | 200 | `total_results: 143000` |
| 3 | `GET /v1/taxa/autocomplete?q=zzqxflorbnak` | 200 | `total_results: 0` |
| 4 | `GET /v1/observations?taxon_name=zzqxflorbnak&per_page=1` | 200 | `total_results: 0` |
| 5 | `GET /v1/observations?per_page=abc` | 200 | Invalid param ignored, returned all 396,659,231 observations |
| 6 | `GET /v1/taxa/999999999` | 200 | `total_results: 0` |
| 7 | `GET /v1/taxa/autocomplete?q=red%20foz&per_page=3` | 200 | `total_results: 0` (typo not corrected) |
| 8 | `GET /v1/observations/species_counts?place_id=1&iconic_taxa=Mammalia&per_page=3&quality_grade=research` | 200 | 515 species; top 3: White-tailed Deer (333,335), Eastern Gray Squirrel (297,391), Eastern Fox Squirrel (164,848) |

All requests were made on 2026-10-27. Counts change as new observations are added.

## 4. Real API Responses

### 4.1 Species search — `GET /v1/taxa/autocomplete?q=red fox&per_page=1`

Full response as returned (HTTP 200):

```json
{
  "total_results": 48,
  "page": 1,
  "per_page": 1,
  "results": [
    {
      "id": 42069,
      "rank": "species",
      "rank_level": 10,
      "iconic_taxon_id": 40151,
      "ancestor_ids": [48460, 1, 2, 355675, 40151, 848317, 848320, 848324, 41573, 42043, 42054, 42069],
      "is_active": true,
      "name": "Vulpes vulpes",
      "parent_id": 42054,
      "ancestry": "48460/1/2/355675/40151/848317/848320/848324/41573/42043/42054",
      "extinct": false,
      "provisional": false,
      "default_photo": {
        "id": 265916780,
        "license_code": null,
        "attribution": "(c) Pierre Noel, all rights reserved, uploaded by Pierre Noel",
        "url": "https://static.inaturalist.org/photos/265916780/square.jpg",
        "original_dimensions": { "height": 1638, "width": 2048 },
        "flags": [],
        "attribution_name": "Pierre Noel",
        "square_url": "https://static.inaturalist.org/photos/265916780/square.jpg",
        "medium_url": "https://static.inaturalist.org/photos/265916780/medium.jpg"
      },
      "taxon_changes_count": 0,
      "taxon_schemes_count": 5,
      "observations_count": 161288,
      "flag_counts": { "resolved": 10, "unresolved": 0 },
      "current_synonymous_taxon_ids": null,
      "atlas_id": 20,
      "complete_species_count": null,
      "wikipedia_url": "http://en.wikipedia.org/wiki/Red_fox",
      "matched_term": "Red Fox",
      "iconic_taxon_name": "Mammalia",
      "preferred_common_name": "Red Fox"
    }
  ]
}
```

### 4.2 One observation (sighting) — `GET /v1/observations?taxon_name=Vulpes vulpes&quality_grade=research&photos=true&per_page=1`

Each observation has **67 top-level fields**. Below are the relevant fields, with values exactly as returned:

```json
{
  "total_results": 143000,
  "page": 1,
  "per_page": 1,
  "results": [
    {
      "id": 411190259,
      "uri": "https://www.inaturalist.org/observations/411190259",
      "observed_on": "2026-10-27",
      "time_observed_at": "2026-10-27T12:23:02-04:00",
      "created_at": "2026-10-27T12:26:54-04:00",
      "quality_grade": "research",
      "place_guess": "Wellington Township, OH 44090, USA",
      "location": "41.1686555556,-82.2354444444",
      "geoprivacy": null,
      "obscured": false,
      "positional_accuracy": null,
      "description": null,
      "license_code": "cc-by-nc",
      "faves_count": 0,
      "num_identification_agreements": 1,
      "identifications_count": 1,
      "species_guess": "Red Fox",
      "user": {
        "id": 5927995,
        "login": "mistaay",
        "name": "Misty R",
        "icon_url": "https://static.inaturalist.org/attachments/users/icons/5927995/7507c40501865eef8026abf08db64f4f-medium.jpeg?1784991561"
      },
      "taxon": {
        "id": 42069,
        "name": "Vulpes vulpes",
        "rank": "species",
        "preferred_common_name": "Red Fox",
        "iconic_taxon_name": "Mammalia",
        "conservation_status": null,
        "threatened": false,
        "native": true,
        "introduced": false,
        "endemic": false
      },
      "photos": [
        {
          "id": 756391864,
          "license_code": "cc-by-nc",
          "original_dimensions": { "width": 1542, "height": 2048 },
          "url": "https://inaturalist-open-data.s3.amazonaws.com/photos/756391864/square.jpg",
          "attribution": "(c) Misty R, some rights reserved (CC BY-NC)",
          "flags": [],
          "moderator_actions": [],
          "hidden": false
        }
      ]
    }
  ]
}
```

## 5. Important Response Fields

### Wrapper (same on every endpoint)

| Field | Meaning |
|---|---|
| `total_results` | Total number of matches in total, not just how many were returned on this page |
| `page` / `per_page` | Current page, and how many results per page (default 30) |
| `results` | The list of matches |

### Species (taxon) fields

| Field | Meaning |
|---|---|
| `id` | iNaturalist's stable ID for the species |
| `name` | Scientific name (e.g. *Vulpes vulpes*) |
| `preferred_common_name` | Everyday name (e.g. Red Fox) |
| `rank` | Taxonomic level: species, genus, family… A search can return a genus or family, not only a species |
| `matched_term` | The text the search actually matched |
| `iconic_taxon_name` | Broad group: Mammalia, Aves (birds), Reptilia, Insecta, Plantae, Fungi, … |
| `observations_count` | Number of sightings recorded for this species, which hints at how common it is |
| `ancestor_ids` / `parent_id` / `ancestry` | Position in the tree of life |
| `default_photo.square_url` / `medium_url` | Image links. Changing `square` in the URL to `medium`, `large`, or `original` gets other sizes |
| `default_photo.attribution` / `license_code` | Photo credit and license. `license_code: null` means all rights reserved |
| `wikipedia_url` | Link to the Wikipedia article |
| `extinct` | Whether the species is extinct |

### Observation (sighting) fields

| Field | Meaning |
|---|---|
| `id`, `uri` | Sighting ID and a link to it on iNaturalist |
| `observed_on` / `time_observed_at` | When the animal was seen |
| `created_at` | When the sighting was uploaded |
| `place_guess` | Readable location text |
| `location` | Coordinates as a `"lat,lng"` string |
| `obscured` / `geoprivacy` | Whether the location was deliberately blurred, which is common for sensitive species |
| `quality_grade` | `research` (community agrees on the ID), `needs_id`, or `casual` |
| `species_guess` | The name the observer gave |
| `taxon` | Species object (as above) plus `native`, `introduced`, `endemic`, `threatened`, `conservation_status` |
| `user` | The observer (`login`, `name`, `icon_url`) |
| `photos[]` | The observer's photos with `url`, `attribution`, `license_code` |
| `num_identification_agreements`, `identifications_count`, `faves_count` | Community activity on the sighting |

## 6. Fields Relevant to FERA

| FERA needs to… | Fields |
|---|---|
| Show a species card | `taxon.id`, `preferred_common_name`, `name`, `default_photo.medium_url`, `default_photo.attribution`, `iconic_taxon_name` |
| Show a sighting card | `id`, `photos[0].url` (resized), `observed_on`, `place_guess`, `taxon.preferred_common_name`, `user.login`, `photos[0].attribution` |
| Save a favorite | The ID, plus possibly a cached name and photo URL so the favorites page loads fast and still works if the API is down (to be decided in Step 2) |
| Handle results | `total_results` for "nothing found" and pagination |
| Link out / give credit | `uri`, `wikipedia_url`, `attribution`, `license_code` |
| Keep data trustworthy (optional) | The `quality_grade=research` filter |

Most of the other 60+ observation fields (identification history, annotations, flags, project data) are not relevant to FERA.

## 7. Empty Search Results and API Behavior

### Empty search — `GET /v1/taxa/autocomplete?q=zzqxflorbnak`

```json
HTTP 200
{"total_results":0,"page":1,"per_page":10,"results":[]}
```

Observations with an unknown name — `GET /v1/observations?taxon_name=zzqxflorbnak&per_page=1`:

```json
HTTP 200
{"total_results":0,"page":1,"per_page":1,"results":[]}
```

### Related behaviors observed

- **Unknown ID is not an error.** `GET /v1/taxa/999999999` returns HTTP 200 with `{"total_results":0,"page":1,"per_page":30,"results":[]}`.
- **Typos are not corrected.** `q=red foz` returned 0 results, while `q=red fox` returned 48. Search matches the start of names.
- **Invalid parameters are silently ignored.** `GET /v1/observations?per_page=abc` did not fail. It returned HTTP 200 with `total_results: 396659231` and the default 30 results. The app must validate its own inputs.
- **Caching headers:** responses include `Cache-Control: public, max-age=120`.

### What this means for the app

- "Nothing found" must be detected by checking `total_results === 0` (or an empty `results`), not by looking for an error status.
- "API unavailable" is a separate case: a network failure, a 5xx error, or a 429 from sending too many requests.
- The assignment requires designed states for **loading**, **nothing found**, and **API unavailable**.

## 8. Potential Features and Product Directions

These are options we discussed. **None has been chosen yet.**

### Product directions

1. **Field journal:** save individual sightings (e.g. a specific fox in Ohio on a specific date), not just species, with an optional private note.
2. **"What's around here?":** pick a place and see the most-seen animals there (`species_counts?place_id=`). Browsing works without having to type a search.
3. **Live "seen today" feed:** recent research-grade sightings worldwide. The Red Fox in request #2 was seen the same morning it was fetched.
4. **Collection / life list:** save species into a personal collection, possibly grouped by category (birds, mammals, insects).
5. **Explorer by category:** browse by `iconic_taxon_name` or conservation status.

### How realistic each feature is for this assignment

| Feature | Fit | Notes |
|---|---|---|
| Search species + species detail page | ✅ Core | Covers loading, empty, and error states naturally |
| Save / unsave favorites, "My Discoveries" page | ✅ Core | The per-user Supabase data the assignment requires |
| Recent sightings of a species | ✅ Easy | One extra call on the detail page |
| Category filter (birds, mammals, …) | ✅ Easy | One URL parameter (`iconic_taxa`) |
| Private note on a saved item | 🟡 Moderate | One extra column; makes the saved data clearly the user's own |
| Browse by place | 🟡 Moderate | Needs a place search (`/v1/places/autocomplete`) |
| Map of sightings | 🟠 Stretch | Needs a map library |
| Location detection ("near me") | 🟠 Stretch | Browser permissions and more edge cases |
| Wikipedia summaries, AI facts, quizzes | 🔴 Out of scope | Would need a second API |
| Uploading your own sightings | 🔴 Out of scope | Needs iNaturalist login (OAuth) |

**Suggestion from Step 1 (not yet a decision):** a small core of search, detail, save, and "My Discoveries", plus one distinguishing twist.

## 9. Key Findings and Considerations

- **No API key needed.** Reads are public, so there is no secret to protect for this API (Clerk and Supabase keys still are).
- **Live, large dataset.** 143,000 research-grade Red Fox sightings alone; ~396 million observations in total.
- **"Not found" returns HTTP 200.** Empty-state logic must check `total_results`, not the status code.
- **Search does not forgive typos.** The empty state should suggest trying a different spelling.
- **Invalid parameters fail silently.** Validate inputs before calling the API.
- **Rate limits.** iNaturalist asks apps to stay at around 60 requests per minute or fewer. Responses are cacheable for 120 seconds. This is relevant to Step 6 (where the API call happens).
- **Photo licensing.** Many photos are "all rights reserved" (`license_code: null`), so photo attribution must be displayed.
- **Obscured locations.** Some sightings have deliberately blurred coordinates (`obscured`, `geoprivacy`), so they shouldn't be presented as exact.
- **Search can return non-species ranks** (genus, family), which the UI may need to handle.
- **Responses are large.** Observations carry 67 top-level fields, and FERA uses only a small subset.

## 10. Open Questions for Step 2

These were raised at the end of Step 1 and are still undecided:

1. Should FERA save **species**, **individual sightings**, or both?
2. Which product direction or twist, if any?
3. Visual style, layout, and whether the API is called from the browser or the server are not yet decided (the latter belongs to Step 6).

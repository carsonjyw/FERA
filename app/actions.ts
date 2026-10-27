"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { getObservation, getSpecies, parseId } from "@/lib/inaturalist";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Every action: Clerk check first, then the Clerk-authenticated Supabase client,
// so RLS limits each write to the signed-in user's own rows. The browser only
// sends an iNaturalist ID; the snapshot (name, photo, credit) is built here from
// iNaturalist, never trusted from the client. user_id is never sent: the
// database fills it in from the Clerk token.

export type ActionResult = { ok: true } | { ok: false; error: string };

const UNIQUE_VIOLATION = "23505";
const MAX_NOTE = 2000;

export async function saveSpecies(rawId: number): Promise<ActionResult> {
  await auth.protect();
  const id = parseId(rawId);
  if (!id) return { ok: false, error: "That species ID isn't valid." };

  const species = await getSpecies(id);
  if (species.status === "unavailable") return { ok: false, error: "iNaturalist isn't responding, so we couldn't save this yet. Try again in a moment." };
  if (species.status === "not_found") return { ok: false, error: "That species no longer exists on iNaturalist." };
  const t = species.data;

  const { error } = await createServerSupabaseClient().from("saved_species").insert({
    taxon_id: t.id,
    common_name: t.commonName,
    scientific_name: t.name,
    iconic_group: t.group,
    photo_url: t.photo?.url ?? null,
    photo_attribution: t.photo?.attribution ?? null,
  });
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("[saveSpecies]", error);
    return { ok: false, error: "Couldn't save right now. Please try again." };
  }
  refresh();
  return { ok: true };
}

export async function saveObservation(rawId: number): Promise<ActionResult> {
  await auth.protect();
  const id = parseId(rawId);
  if (!id) return { ok: false, error: "That sighting ID isn't valid." };

  const obs = await getObservation(id);
  if (obs.status === "unavailable") return { ok: false, error: "iNaturalist isn't responding, so we couldn't save this yet. Try again in a moment." };
  if (obs.status === "not_found") return { ok: false, error: "That sighting is no longer on iNaturalist." };
  const o = obs.data;

  const { error } = await createServerSupabaseClient().from("saved_observations").insert({
    observation_id: o.id,
    taxon_id: o.taxon?.id ?? null,
    common_name: o.taxon?.commonName ?? o.taxon?.name ?? null,
    photo_url: o.photo?.url ?? null,
    photo_attribution: o.photo?.attribution ?? null,
    observed_on: o.observedOn,
    place_guess: o.placeGuess,
    observer_login: o.observer,
  });
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error("[saveObservation]", error);
    return { ok: false, error: "Couldn't save right now. Please try again." };
  }
  refresh();
  return { ok: true };
}

export async function removeSaved(kind: "species" | "observation", rawId: number): Promise<ActionResult> {
  await auth.protect();
  const id = parseId(rawId);
  if (!id) return { ok: false, error: "That item ID isn't valid." };

  const supabase = createServerSupabaseClient();
  const { error } =
    kind === "species"
      ? await supabase.from("saved_species").delete().eq("taxon_id", id)
      : await supabase.from("saved_observations").delete().eq("observation_id", id);
  if (error) {
    console.error("[removeSaved]", error);
    return { ok: false, error: "Couldn't remove it right now. Please try again." };
  }
  refresh();
  return { ok: true };
}

export async function updateNote(
  kind: "species" | "observation",
  rawId: number,
  rawNote: string,
): Promise<ActionResult> {
  await auth.protect();
  const id = parseId(rawId);
  if (!id) return { ok: false, error: "That item ID isn't valid." };
  const note = String(rawNote ?? "").trim();
  if (note.length > MAX_NOTE) return { ok: false, error: `Notes can be up to ${MAX_NOTE} characters.` };

  const supabase = createServerSupabaseClient();
  const value = note === "" ? null : note;
  const { data, error } =
    kind === "species"
      ? await supabase.from("saved_species").update({ note: value }).eq("taxon_id", id).select("id")
      : await supabase.from("saved_observations").update({ note: value }).eq("observation_id", id).select("id");
  if (error) {
    console.error("[updateNote]", error);
    return { ok: false, error: "Couldn't save your note. Please try again." };
  }
  if (!data?.length) return { ok: false, error: "Save this item first, then add a note." };
  refresh();
  return { ok: true };
}

"use client";

import { type RefObject, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { removeSaved, saveObservation, saveSpecies } from "@/app/actions";
import { useToast } from "./toast";

export type SaveKind = "species" | "observation";

export const collectionHref = (kind: SaveKind) => (kind === "species" ? "/discoveries" : "/discoveries?tab=sightings");

// One interaction pattern for every save control (card heart, detail button):
// save is instant and confirmed with a message + link; removing asks first,
// inline, because it also deletes the private note.
export function useSaveToggle({
  kind,
  id,
  saved,
  label,
  triggerRef,
}: {
  kind: SaveKind;
  id: number;
  saved: boolean;
  label: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return keyboard focus to the main control (owned by the caller) after the confirmation closes.
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (wasConfirming.current && !confirming) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming, triggerRef]);

  function run(nextSaved: boolean) {
    setError(null);
    setConfirming(false);
    startTransition(async () => {
      setOptimisticSaved(nextSaved);
      const result = nextSaved
        ? kind === "species"
          ? await saveSpecies(id)
          : await saveObservation(id)
        : await removeSaved(kind, id);
      if (!result.ok) {
        setError(result.error);
        toast({ message: result.error });
        return;
      }
      toast(
        nextSaved
          ? { message: `Saved ${label}`, href: collectionHref(kind), linkLabel: "View in My Discoveries" }
          : { message: `Removed ${label} from My Discoveries` },
      );
    });
  }

  return {
    saved: optimisticSaved,
    pending,
    confirming,
    error,
    save: () => run(true),
    askRemove: () => setConfirming(true),
    cancelRemove: () => setConfirming(false),
    confirmRemove: () => run(false),
  };
}

"use client";

import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRef } from "react";
import { HeartIcon } from "./icons";
import { collectionHref, type SaveKind, useSaveToggle } from "./use-save-toggle";

const noun = (kind: SaveKind) => (kind === "species" ? "animal" : "sighting");

// Large button on animal and sighting pages.
export function SaveButton({ kind, id, saved, label }: { kind: SaveKind; id: number; saved: boolean; label: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const t = useSaveToggle({ kind, id, saved, label, triggerRef });

  if (t.confirming) {
    return (
      <div
        role="group"
        aria-label={`Remove ${label} from My Discoveries?`}
        onKeyDown={(e) => e.key === "Escape" && t.cancelRemove()}
        className="max-w-md"
      >
        <p className="font-semibold">Remove from My Discoveries?</p>
        <p className="mt-0.5 text-sm text-muted">Any private note you wrote about it will be deleted too.</p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={t.confirmRemove}
            className="rounded-full bg-danger px-5 py-2 font-semibold text-accent-ink hover:brightness-110"
          >
            Yes, remove
          </button>
          <button
            type="button"
            autoFocus
            onClick={t.cancelRemove}
            className="rounded-full px-5 py-2 font-semibold ring-1 ring-white/30 hover:bg-white/10"
          >
            Keep it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        ref={triggerRef}
        type="button"
        onClick={t.saved ? t.askRemove : t.save}
        disabled={t.pending}
        aria-label={t.saved ? `Saved. Remove ${label} from My Discoveries` : undefined}
        title={t.saved ? "Click to remove from My Discoveries" : undefined}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition disabled:opacity-70 ${
          t.saved
            ? "bg-white/10 text-foreground ring-1 ring-white/30 hover:bg-white/15"
            : "bg-accent text-accent-ink hover:brightness-110"
        }`}
      >
        <HeartIcon filled={t.saved} />
        {t.saved ? "Saved" : `Save this ${noun(kind)}`}
      </button>
      {t.saved && (
        <Link href={collectionHref(kind)} className="text-sm font-semibold text-accent underline">
          View in My Discoveries →
        </Link>
      )}
      <p aria-live="polite" className="text-sm text-danger">
        {t.error}
      </p>
    </div>
  );
}

// Small heart in the corner of a card. `saved` is null when signed out.
export function HeartButton({
  kind,
  id,
  saved,
  label,
}: {
  kind: SaveKind;
  id: number;
  saved: boolean | null;
  label: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const t = useSaveToggle({ kind, id, saved: saved ?? false, label, triggerRef });
  const base =
    "absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur transition disabled:opacity-70";

  if (saved === null) {
    return (
      <SignInButton>
        <button
          type="button"
          aria-label={`Sign in to save ${label}`}
          title="Sign in to save"
          className={`${base} bg-black/55 text-white ring-1 ring-white/30 hover:bg-black/75`}
        >
          <HeartIcon />
        </button>
      </SignInButton>
    );
  }

  if (t.confirming) {
    return (
      <div
        role="group"
        aria-label={`Remove ${label} from My Discoveries?`}
        onKeyDown={(e) => e.key === "Escape" && t.cancelRemove()}
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/85 py-1 pl-3 pr-1 text-xs backdrop-blur ring-1 ring-white/30"
      >
        <span>Remove?</span>
        <button
          type="button"
          onClick={t.confirmRemove}
          className="min-h-9 rounded-full bg-danger px-3 font-semibold text-accent-ink"
        >
          Yes
        </button>
        <button
          type="button"
          autoFocus
          onClick={t.cancelRemove}
          className="min-h-9 rounded-full px-3 font-semibold ring-1 ring-white/30"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={t.saved ? t.askRemove : t.save}
      disabled={t.pending}
      aria-label={t.saved ? `Remove ${label} from My Discoveries` : `Save ${label} to My Discoveries`}
      title={t.saved ? "Saved. Click to remove" : "Save to My Discoveries"}
      className={`${base} ${
        t.saved ? "bg-accent text-accent-ink ring-1 ring-accent" : "bg-black/55 text-white ring-1 ring-white/30 hover:bg-black/75"
      }`}
    >
      <HeartIcon filled={t.saved} />
    </button>
  );
}

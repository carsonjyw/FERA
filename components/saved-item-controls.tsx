"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { removeSaved, updateNote } from "@/app/actions";
import { useToast } from "./toast";

const MAX_NOTE = 2000;

export function NoteEditor({
  kind,
  id,
  initialNote,
  label,
}: {
  kind: "species" | "observation";
  id: number;
  initialNote: string | null;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNote ?? "");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fieldId = `note-${kind}-${id}`;

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateNote(kind, id, draft);
      if (result.ok) {
        setEditing(false);
        setMessage({ tone: "ok", text: "Note saved" });
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  if (!editing) {
    return (
      <div className="mt-3">
        {initialNote ? (
          <p className="whitespace-pre-line rounded-lg bg-surface-2 p-3 text-sm italic text-foreground/90">
            {initialNote}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDraft(initialNote ?? "");
              setEditing(true);
              setMessage(null);
            }}
            className="text-sm font-semibold text-accent hover:underline"
            aria-label={`${initialNote ? "Edit" : "Add"} private note for ${label}`}
          >
            {initialNote ? "Edit note" : "+ Add a private note"}
          </button>
          <span aria-live="polite" className={`text-xs ${message?.tone === "error" ? "text-danger" : "text-muted"}`}>
            {message?.text}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <label htmlFor={fieldId} className="text-xs uppercase tracking-wider text-muted">
        Private note (only you can see this)
      </label>
      <textarea
        id={fieldId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MAX_NOTE}
        rows={3}
        autoFocus
        className="mt-1 w-full rounded-lg border border-line bg-surface-2 p-3 text-sm focus:border-accent focus:outline-none"
        placeholder="Where you'd like to see it, what you noticed, a memory…"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save note"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted hover:text-foreground">
          Cancel
        </button>
        <span className="ml-auto text-xs text-muted">
          {draft.length}/{MAX_NOTE}
        </span>
      </div>
      <p aria-live="polite" className="mt-1 text-xs text-danger">
        {message?.tone === "error" ? message.text : null}
      </p>
    </div>
  );
}

export function RemoveButton({ kind, id, label }: { kind: "species" | "observation"; id: number; label: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return keyboard focus to "Remove" after the confirmation closes.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (wasConfirming.current && !confirming) triggerRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  function confirmRemove() {
    setError(null);
    setConfirming(false);
    startTransition(async () => {
      const result = await removeSaved(kind, id);
      if (result.ok) toast({ message: `Removed ${label} from My Discoveries` });
      else setError(result.error);
    });
  }

  if (confirming) {
    return (
      <div
        role="group"
        aria-label={`Remove ${label} from My Discoveries?`}
        onKeyDown={(e) => e.key === "Escape" && setConfirming(false)}
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
      >
        <span>Remove? Your note will be deleted too.</span>
        <button
          type="button"
          onClick={confirmRemove}
          className="min-h-10 rounded-full bg-danger px-4 font-semibold text-accent-ink hover:brightness-110"
        >
          Yes, remove
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => setConfirming(false)}
          className="min-h-10 rounded-full px-4 font-semibold ring-1 ring-white/30 hover:bg-white/10"
        >
          Keep it
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        ref={triggerRef}
        type="button"
        disabled={pending}
        onClick={() => setConfirming(true)}
        className="min-h-10 text-sm text-muted hover:text-danger disabled:opacity-60"
        aria-label={`Remove ${label} from My Discoveries`}
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      <span aria-live="polite" className="text-xs text-danger">
        {error}
      </span>
    </span>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className="rounded-full bg-accent px-5 py-2 font-medium text-accent-ink disabled:opacity-60"
    >
      {pending ? "Trying again…" : "Try again"}
    </button>
  );
}

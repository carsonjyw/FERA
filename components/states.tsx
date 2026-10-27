import Link from "next/link";
import { RetryButton } from "./retry-button";

// The three designed states for anything that depends on iNaturalist:
// loading (skeletons), nothing found, and API unavailable.

export function SkeletonGrid({ count = 8, label = "Loading wildlife" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-surface">
          <div className="aspect-[4/3] bg-surface-2 motion-safe:animate-pulse" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 rounded bg-surface-2 motion-safe:animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-surface-2 motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="h-[55vh] min-h-72 bg-surface motion-safe:animate-pulse" />
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 sm:px-6">
        <div className="h-8 w-1/2 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-full rounded bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-surface-2 motion-safe:animate-pulse" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ApiUnavailable({ what = "wildlife data" }: { what?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
      <p className="text-lg font-semibold">iNaturalist isn&apos;t responding right now</p>
      <p className="mx-auto mt-2 max-w-md text-muted">
        We couldn&apos;t load {what}. This is usually brief. Your saved discoveries are stored by FERA and
        still available.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <RetryButton />
        <Link href="/discoveries" className="rounded-full border border-line px-5 py-2 hover:bg-surface-2">
          My Discoveries
        </Link>
      </div>
    </div>
  );
}

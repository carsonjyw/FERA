import { SkeletonGrid } from "@/components/states";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-12 w-72 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="mt-8">
        <SkeletonGrid count={6} label="Loading your discoveries" />
      </div>
    </main>
  );
}

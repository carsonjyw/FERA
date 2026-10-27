import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SpeciesCard } from "@/components/cards";
import { GroupChips } from "@/components/group-chips";
import { ApiUnavailable, EmptyState, SkeletonGrid } from "@/components/states";
import { GROUPS, groupBySlug } from "@/lib/groups";
import { getTopSpecies } from "@/lib/inaturalist";
import { getSavedIds } from "@/lib/saved";

export function generateStaticParams() {
  return GROUPS.map((g) => ({ group: g.slug }));
}

export default async function ExplorePage({ params }: PageProps<"/explore/[group]">) {
  const group = groupBySlug((await params).group);
  if (!group) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
      <div className="-mx-4 sm:-mx-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: group.label }]} />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-accent">Browse animals</p>
      <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">{group.label}</h1>
      <p className="mt-2 text-muted">The most-observed {group.label.toLowerCase()} on iNaturalist, worldwide.</p>
      <div className="mt-6">
        <GroupChips active={group.slug} />
      </div>
      <div className="mt-8">
        <Suspense fallback={<SkeletonGrid count={12} label={`Loading ${group.label.toLowerCase()}`} />}>
          <TopSpecies iconic={group.iconic} label={group.label} />
        </Suspense>
      </div>
    </main>
  );
}

async function TopSpecies({ iconic, label }: { iconic: string; label: string }) {
  const [result, saved] = await Promise.all([getTopSpecies(iconic), getSavedIds()]);
  if (result.status === "unavailable") return <ApiUnavailable what={label.toLowerCase()} />;
  if (result.status === "not_found") return <EmptyState title={`No ${label.toLowerCase()} found`} />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {result.data.map((t, i) => (
        <SpeciesCard key={t.id} taxon={t} count={t.count} eager={i < 8} saved={saved ? saved.species.has(t.id) : null} />
      ))}
    </div>
  );
}

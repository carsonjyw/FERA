import Link from "next/link";
import { GROUPS } from "@/lib/groups";

export function GroupChips({ active }: { active?: string }) {
  return (
    <nav aria-label="Browse by animal group" className="flex flex-wrap gap-2">
      {GROUPS.map((g) => (
        <Link
          key={g.slug}
          href={`/explore/${g.slug}`}
          aria-current={active === g.slug ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wide ring-1 transition ${
            active === g.slug
              ? "bg-accent text-accent-ink ring-accent"
              : "bg-white/5 text-foreground ring-white/20 hover:bg-white/10"
          }`}
        >
          {g.label}
        </Link>
      ))}
    </nav>
  );
}

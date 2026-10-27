"use client";

import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "./icons";

// Search is one tap away on every page. It's hidden where a bigger search box
// is already on screen (home and the search page).
function useHidden() {
  const pathname = usePathname();
  return pathname === "/" || pathname === "/search";
}

export function HeaderSearchForm() {
  if (useHidden()) return null;
  return (
    <Form action="/search" role="search" className="relative ml-2 hidden w-full max-w-sm sm:block">
      <label htmlFor="header-q" className="sr-only">
        Search animals
      </label>
      <input
        id="header-q"
        name="q"
        type="search"
        placeholder="Search animals"
        maxLength={60}
        autoComplete="off"
        className="w-full rounded-full border border-white/15 bg-white/5 py-1.5 pl-4 pr-11 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-foreground"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </Form>
  );
}

export function HeaderSearchIcon() {
  if (useHidden()) return null;
  return (
    <Link
      href="/search"
      aria-label="Search animals"
      className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:text-foreground sm:hidden"
    >
      <SearchIcon />
    </Link>
  );
}

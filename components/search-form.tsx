import Form from "next/form";
import { SearchIcon } from "./icons";

// Plain GET form: works without JavaScript, and results get a shareable URL.
export function SearchForm({
  defaultValue = "",
  size = "md",
  autoFocus,
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
}) {
  const lg = size === "lg";
  return (
    <Form action="/search" role="search" className="flex w-full gap-2">
      <label htmlFor={`q-${size}`} className="sr-only">
        Search animals by common or scientific name
      </label>
      <input
        id={`q-${size}`}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search animals, e.g. owl"
        maxLength={60}
        autoFocus={autoFocus}
        autoComplete="off"
        className={`min-w-0 flex-1 rounded-full border border-white/20 bg-black/40 text-foreground placeholder:text-muted backdrop-blur focus:border-accent focus:outline-none ${
          lg ? "px-6 py-4 text-lg" : "px-4 py-2"
        }`}
      />
      <button
        type="submit"
        aria-label="Search"
        className={`shrink-0 rounded-full bg-accent font-semibold text-accent-ink hover:brightness-110 ${lg ? "px-5 py-4 text-lg sm:px-7" : "px-4 py-2"}`}
      >
        {lg ? (
          <>
            <SearchIcon className="h-6 w-6 sm:hidden" />
            <span className="hidden sm:inline">Search</span>
          </>
        ) : (
          "Search"
        )}
      </button>
    </Form>
  );
}

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { getSavedIds } from "@/lib/saved";
import { HeartIcon } from "./icons";
import { SaveButton } from "./save-button";

// Whether the signed-in user already saved this item (RLS scopes the lookup to
// them). Signed out, it invites them to create a free account. Render inside <Suspense>.
export async function SavedStatus({ kind, id, label }: { kind: "species" | "observation"; id: number; label: string }) {
  const ids = await getSavedIds();
  const noun = kind === "species" ? "animal" : "sighting";

  if (!ids) {
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <SignUpButton>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110"
          >
            <HeartIcon />
            Create a free account to save this {noun}
          </button>
        </SignUpButton>
        <span className="text-sm text-muted">
          Already have one?{" "}
          <SignInButton>
            <button type="button" className="font-semibold text-foreground underline">
              Sign in
            </button>
          </SignInButton>
        </span>
      </div>
    );
  }

  const saved = kind === "species" ? ids.species.has(id) : ids.observations.has(id);
  return <SaveButton kind={kind} id={id} saved={saved} label={label} />;
}

import type { Photo } from "@/lib/inaturalist";
import { WildlifePhoto } from "./photo";

// Full-bleed photo behind a hero, with a gradient so text stays readable.
// No negative z-index: later siblings with `relative` simply paint on top, which
// is more reliable than stacking behind the page background. The visible base
// color means there is never an empty black hero while the photo loads.
export function HeroBackdrop({ photo, alt, priority = true }: { photo: Photo | null; alt: string; priority?: boolean }) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-surface-2 to-surface">
        <WildlifePhoto photo={photo} alt={alt} sizes="100vw" priority={priority} large />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
    </>
  );
}

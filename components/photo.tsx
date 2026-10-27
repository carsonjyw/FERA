"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/inaturalist";

// Fills its (relatively positioned) parent. iNaturalist already serves sized
// images, so skip Next's optimizer. If the image fails to load, show a quiet
// placeholder instead of a black hole.
export function WildlifePhoto({
  photo,
  alt,
  sizes,
  priority,
  eager,
  large,
  className = "",
}: {
  photo: Photo | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  eager?: boolean; // load now (first screenful) instead of lazily on scroll
  large?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // A loaded image can sit unpainted until the browser finishes its async decode
  // (seen on streamed pages). Ask for the decode as soon as the image is ready,
  // including images that finished loading before hydration.
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (ref.current?.complete) ref.current.decode().catch(() => {});
  }, []);

  if (!photo || failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-2 px-3 text-center text-sm text-muted">
        {photo ? "This photo couldn’t load" : "No photo available"}
      </div>
    );
  }
  return (
    <Image
      ref={ref}
      src={large ? photo.largeUrl : photo.url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={eager && !priority ? "eager" : undefined}
      unoptimized
      decoding={priority ? "sync" : "async"}
      onLoad={(e) => e.currentTarget.decode().catch(() => {})}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

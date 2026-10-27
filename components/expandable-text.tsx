"use client";

import { useState } from "react";

// Long text starts short, with "Read more". Short text is shown in full.
export function ExpandableText({ text, limit = 400 }: { text: string; limit?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  return (
    <div>
      <p className={`leading-relaxed text-foreground/90 ${long && !open ? "line-clamp-4" : ""}`}>{text}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="mt-2 min-h-9 text-sm font-semibold text-accent underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

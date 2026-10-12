"use client";

import { useId, useState } from "react";

/**
 * Editorial intro that is always fully present in the HTML (crawlers and screen readers get all of it) but is
 * clamped to a few lines on phones so the product grid is not pushed below the first screen. From md up the
 * clamp is removed and the toggle hidden.
 */
export default function ExpandableIntro({ text, className = "" }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const long = text.length > 200; // a one-line intro needs no toggle
  return (
    <div className={className}>
      <p id={id} className={`text-base leading-relaxed text-stone-dark ${open || !long ? "" : "line-clamp-4 md:line-clamp-none"}`}>
        {text}
      </p>
      {long && (
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-moss md:hidden"
      >
        <span className="border-b border-charcoal">{open ? "Read less" : "Read more"}</span>
      </button>
      )}
    </div>
  );
}

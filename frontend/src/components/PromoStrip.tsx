"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { safeHref } from "@/lib/hero";
import { useSettings } from "@/lib/settings-context";
import { CloseIcon } from "./chrome/icons";

const KEY = "fp_announcement_dismissed";

/**
 * Optional announcement bar. Driven entirely by settings: `homepage.announcement` (text) and
 * `homepage.announcementHref` (relative path). Hidden when empty or dismissed for the session. Renders
 * nothing until mounted so the server HTML and the first client render always agree.
 */
export default function PromoStrip() {
  const settings = useSettings();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(KEY));
    } catch {
      /* storage unavailable: show the bar */
    }
    setMounted(true);
  }, []);

  const text = settings.raw?.["homepage.announcement"]?.trim();
  if (!mounted || !text || dismissed === text) return null;

  const rawHref = settings.raw["homepage.announcementHref"]?.trim();
  const href = rawHref ? safeHref(rawHref) : null;
  const dismiss = () => {
    setDismissed(text);
    try {
      sessionStorage.setItem(KEY, text);
    } catch {
      /* ignore */
    }
  };
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory";

  return (
    <section aria-label="Announcement" className="bg-charcoal text-ivory">
      <div className="mx-auto grid min-h-[44px] w-full max-w-[1280px] grid-cols-[44px_1fr_44px] items-center px-2 md:px-5">
        <span aria-hidden />
        <p className="py-2 text-center text-[13px] leading-snug tracking-[0.04em]">
          {href ? (
            <Link href={href} className={`underline decoration-stone underline-offset-4 transition-colors hover:decoration-ivory ${focus}`}>
              {text}
            </Link>
          ) : (
            text
          )}
        </p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={dismiss}
          className={`flex h-11 w-11 items-center justify-center text-ivory ${focus}`}
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    </section>
  );
}

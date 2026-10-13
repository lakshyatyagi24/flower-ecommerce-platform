"use client";
import type { ReactNode } from "react";
import { useSettings } from "@/lib/settings-context";
import { deliverySummary, returnsSummary } from "@/lib/contact-channels";

/** The store's own delivery / returns summary from settings (`policies.*`). Renders nothing when unset. */
export default function PolicySummary({ kind, title, className = "" }: { kind: "delivery" | "returns"; title?: ReactNode; className?: string }) {
  const settings = useSettings();
  const text = kind === "delivery" ? deliverySummary(settings) : returnsSummary(settings);
  if (!text) return null;
  return (
    <div className={`border-l-2 border-moss pl-5 ${className}`.trim()}>
      {title ? <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">{title}</p> : null}
      <p className={`${title ? "mt-2 " : ""}whitespace-pre-line text-base leading-relaxed text-charcoal`}>{text}</p>
    </div>
  );
}

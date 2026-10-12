import React from "react";

type Phase = { key: string; label: string; time?: Date | null };

function fmt(d: Date): string {
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Vertical order progress: a thin line, one dot per step. Completed steps and the line leading to them are moss,
 * the current step has a larger, ringed dot and a stronger label, upcoming steps are a hollow stone dot.
 * Status is also conveyed in text for screen readers (no colour-only meaning).
 */
export default function OrderTimeline({ phases, currentIndex }: { phases: Phase[]; currentIndex: number }) {
  return (
    <ol aria-label="Order progress" className="relative">
      {phases.map((p, i) => {
        const done = Boolean(p.time) && i <= currentIndex;
        const current = done && i === currentIndex;
        const last = i === phases.length - 1;
        const nextDone = !last && Boolean(phases[i + 1].time) && i + 1 <= currentIndex;
        const state = current ? "Current step" : done ? "Completed" : "Upcoming";
        return (
          <li key={p.key} aria-current={current ? "step" : undefined} data-state={current ? "current" : done ? "done" : "upcoming"} className={`relative pl-10 ${last ? "" : "pb-9"}`}>
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-[7px] top-5 bottom-0 w-px ${nextDone ? "bg-moss" : "bg-stone-light"}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`absolute top-[3px] box-border rounded-full ${
                current
                  ? "left-0 h-4 w-4 bg-moss outline outline-1 outline-offset-4 outline-moss"
                  : done
                    ? "left-[3px] h-2.5 w-2.5 bg-moss"
                    : "left-[3px] h-2.5 w-2.5 border border-stone bg-ivory"
              }`}
            />
            <p className={`text-xs uppercase tracking-[0.16em] ${current ? "font-semibold text-charcoal" : done ? "font-medium text-charcoal" : "font-medium text-stone-dark"}`}>
              {p.label}
              <span className="sr-only"> — {state}</span>
            </p>
            {p.time && (
              <p className="mt-1 text-sm text-stone-dark">
                <time dateTime={p.time.toISOString()}>{fmt(p.time)}</time>
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

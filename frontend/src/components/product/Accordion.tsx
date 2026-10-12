import type { ReactNode } from "react";

/** Native <details> accordion, no JS. */
export default function Accordion({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-stone-light">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="text-lg font-normal text-stone transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-3 pb-6 text-sm leading-relaxed text-stone-dark">{children}</div>
    </details>
  );
}

import type { FaqItem } from '@/app/faq/faq-data';

/**
 * Question list on native <details>: keyboard and screen-reader accessible with no JavaScript, and every
 * answer stays in the HTML for crawlers. Server-renderable.
 */
export default function FaqList({ items, idPrefix }: { items: FaqItem[]; idPrefix: string }) {
  return (
    <div className="border-t border-stone-light">
      {items.map((it, i) => (
        <details key={it.q} id={`${idPrefix}-q-${i}`} className="group border-b border-stone-light">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 py-5 text-base text-charcoal marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss [&::-webkit-details-marker]:hidden">
            <span className="font-display text-xl leading-snug">{it.q}</span>
            <svg
              className="h-4 w-4 shrink-0 text-stone-dark transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </summary>
          <p className="max-w-[640px] pb-6 text-base leading-[1.75] text-stone-dark">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

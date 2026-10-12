import type { Usp } from '@/lib/product-helpers';

/** One thin row of up to three short statements, hairline-separated (stacked on mobile). */
export default function UspLine({ usps }: { usps: Usp[] }) {
  const items = usps.slice(0, 3);
  if (items.length === 0) return null;
  return (
    <section aria-label="Why Fresh Petals" className="border-b border-stone-light">
      <ul className="mx-auto grid w-full max-w-[1280px] divide-y divide-stone-light md:auto-cols-fr md:grid-flow-col md:divide-x md:divide-y-0">
        {items.map((u) => (
          <li key={u.title} className="px-5 py-5 text-center md:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-charcoal">{u.title}</p>
            {u.body && <p className="mt-1 text-sm text-stone-dark">{u.body}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

import Link from "next/link";
import { OCCASIONS } from "@/lib/occasions";
import type { ApiCategory } from "@/lib/api";

const link =
  "inline-block border-b border-transparent py-1 text-sm text-charcoal transition-colors hover:border-charcoal " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss";

/**
 * Internal links under a landing page: other collections and the occasion list. Plain crawlable anchors.
 * The current page is left out of its own list.
 */
export default function RelatedLinks({
  collections = [],
  currentCollection,
  currentOccasion,
}: {
  collections?: Pick<ApiCategory, "id" | "name" | "slug">[];
  currentCollection?: string;
  currentOccasion?: string;
}) {
  const others = collections.filter((c) => c.slug !== currentCollection);
  const occasions = OCCASIONS.filter((o) => o.slug !== currentOccasion);
  return (
    <aside aria-label="Explore more" className="mt-20 grid gap-10 border-t border-stone-light pt-12 md:grid-cols-2 md:gap-16">
      {others.length > 0 && (
        <section aria-labelledby="related-collections">
          <h2 id="related-collections" className="type-h3 text-charcoal">
            More collections
          </h2>
          <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
            {others.map((c) => (
              <li key={c.id}>
                <Link href={`/collections/${encodeURIComponent(c.slug)}`} className={link}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="related-occasions">
        <h2 id="related-occasions" className="type-h3 text-charcoal">
          Shop by occasion
        </h2>
        <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
          {occasions.map((o) => (
            <li key={o.slug}>
              <Link href={`/occasions/${o.slug}`} className={link}>
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import EmptyState from "@/components/ui/EmptyState";
import JsonLd from "@/components/JsonLd";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/product/Pagination";
import SortSelect from "@/components/product/SortSelect";
import ListingBusy from "@/components/product/ListingBusy";
import ExpandableIntro from "@/components/product/ExpandableIntro";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { listHref, type ListParams } from "@/lib/list-params";
import { shownCategories } from "@/lib/categories";
import type { ApiCategory } from "@/lib/api";
import type { ProductPage } from "@/lib/server-api";

export type CatalogueViewProps = {
  /** This page's own path: sort and pagination links are built from it (/products, /collections/roses, ...). */
  basePath: string;
  params: ListParams;
  result: ProductPage;
  eyebrow: string;
  heading: string;
  intro: string;
  /** Top-level categories for the filter bar; omit to hide the bar (e.g. occasion pages). */
  categories?: ApiCategory[];
  /** Slug of the category this page is about (highlights its chip). */
  activeCategorySlug?: string;
  /** Visible breadcrumb + BreadcrumbList JSON-LD; omit for /products. */
  breadcrumb?: { name: string; path: string }[];
  /** True when something narrows the list beyond the page itself (search/tag): changes the empty-state copy. */
  filtered?: boolean;
  empty?: { title: string; body: string; cta?: { href: string; label: string } };
  /** Internal-linking block rendered under the pagination. */
  related?: ReactNode;
};

const chip = (active: boolean) =>
  `whitespace-nowrap border-b py-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss ${
    active ? "border-charcoal text-charcoal" : "border-transparent text-stone-dark hover:text-charcoal"
  }`;

/**
 * The one listing view behind /products, /collections/[slug] and /occasions/[slug] (ruling R9).
 * Pure presentation: data is fetched by the page (see lib/catalogue-data.ts), so it renders in tests.
 */
export default function CatalogueView(props: CatalogueViewProps) {
  const { basePath, params, result, eyebrow, heading, intro, categories, activeCategorySlug, breadcrumb, related } = props;
  const { items, total, page, pages } = result;
  const chips = categories ? shownCategories(categories) : undefined; // empty categories are not advertised
  const href = (overrides: Partial<ListParams> = {}) => listHref(params, overrides, basePath);
  const empty = props.empty ?? {
    title: "No flowers match",
    body: props.filtered ? "Try a different category or search, or clear your filters." : "Please check back soon.",
    cta: props.filtered ? { href: "/products", label: "Clear filters" } : undefined,
  };

  return (
    <main className="pb-24">
      {items.length > 0 && <JsonLd data={itemListJsonLd(items)} />}
      {breadcrumb && <JsonLd data={breadcrumbJsonLd(breadcrumb)} />}
      {page > 1 && <link rel="prev" href={href({ page: page - 1 })} />}
      {page < pages && <link rel="next" href={href({ page: page + 1 })} />}

      <Container>
        <ListingBusy basePath={basePath}>
          <header className="pb-10 pt-12 md:pb-14 md:pt-20">
            {breadcrumb && (
              <nav aria-label="Breadcrumb" className="mb-6 text-sm text-stone-dark">
                <ol className="flex flex-wrap items-center gap-x-2">
                  {breadcrumb.map((b, i) => {
                    const last = i === breadcrumb.length - 1;
                    return (
                      <li key={b.path} className="flex items-center gap-x-2">
                        {last ? (
                          <span aria-current="page">{b.name}</span>
                        ) : (
                          <Link href={b.path} className="hover:text-charcoal">
                            {b.name}
                          </Link>
                        )}
                        {!last && <span aria-hidden="true">/</span>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}
            <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
            <h1 className="type-h1 text-charcoal">{heading}</h1>
            <ExpandableIntro text={intro} className="mt-5 max-w-2xl" />
            <p className="mt-6 text-sm text-stone-dark" aria-live="polite">
              {total} {total === 1 ? "product" : "products"}
              {pages > 1 ? ` · page ${page} of ${pages}` : ""}
            </p>
          </header>

          <div className="flex flex-col gap-4 border-y border-stone-light py-3 md:flex-row md:items-center md:justify-between">
            {chips ? (
              <nav aria-label="Categories" className="-mx-5 overflow-x-auto overflow-y-hidden px-5 md:mx-0 md:px-0">
                <ul className="flex items-center gap-7">
                  <li>
                    <Link
                      href={listHref({ sort: params.sort, page: 1 })}
                      aria-current={!activeCategorySlug ? "page" : undefined}
                      className={chip(!activeCategorySlug)}
                    >
                      All
                    </Link>
                  </li>
                  {chips.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/collections/${encodeURIComponent(c.slug)}${params.sort ? `?sort=${params.sort}` : ""}`}
                        aria-current={activeCategorySlug === c.slug ? "page" : undefined}
                        className={chip(activeCategorySlug === c.slug)}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : (
              <span />
            )}
            <SortSelect value={params.sort ?? "newest"} basePath={basePath} />
          </div>

          <div className="mt-10 md:mt-14">
            {items.length === 0 ? (
              <EmptyState title={empty.title} body={empty.body} cta={empty.cta} />
            ) : (
              <div data-grid>
                <ProductGrid products={items} priorityCount={4} />
              </div>
            )}
          </div>

          <Pagination params={params} page={page} pages={pages} basePath={basePath} />
        </ListingBusy>

        {related}
      </Container>
    </main>
  );
}

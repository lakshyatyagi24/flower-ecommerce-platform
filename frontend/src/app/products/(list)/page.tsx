import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import EmptyState from "@/components/ui/EmptyState";
import JsonLd from "@/components/JsonLd";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/product/Pagination";
import SortSelect from "@/components/product/SortSelect";
import { listCategories, listProducts } from "@/lib/server-api";
import { itemListJsonLd, metaDescription } from "@/lib/seo";
import { PAGE_SIZE, listHref, parseListParams, type RawSearchParams } from "@/lib/list-params";

// R1: never prerender at build time (the API is not reachable during `next build`).
export const dynamic = "force-dynamic";

type Props = { searchParams?: RawSearchParams };

async function load(searchParams: RawSearchParams) {
  const params = parseListParams(searchParams);
  const [result, categories] = await Promise.all([
    listProducts({
      category: params.category,
      tag: params.tag,
      sort: params.sort,
      q: params.q,
      page: params.page,
      take: PAGE_SIZE,
    }),
    listCategories().catch(() => []), // the filter bar degrades; the grid does not depend on it
  ]);
  const topLevel = categories.filter((c) => c.active !== false && !c.parentId);
  const activeCategory = params.category ? categories.find((c) => c.slug === params.category) : undefined;
  return { params, result, categories: topLevel, activeCategory };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { params, result, activeCategory } = await load(searchParams);
  const title = activeCategory ? `Fresh Cut Flowers Online — ${activeCategory.name}` : "Fresh Cut Flowers Online";
  const description = metaDescription(
    activeCategory?.description ||
      "Shop farm-fresh cut flowers, bouquets and plants from Fresh Petals India. Hand-selected stems, delivered fresh.",
  );
  // Canonical keeps the filters that change the product set (category, tag, page) and drops sort/search.
  const canonical = params.q ? "/products" : listHref({ category: params.category, tag: params.tag, page: params.page });
  const noindex = Boolean(params.q) || result.items.length === 0;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const { params, result, categories, activeCategory } = await load(searchParams);
  const { items, total, page, pages } = result;

  const heading = params.q
    ? `Results for “${params.q}”`
    : activeCategory
      ? activeCategory.name
      : "Fresh cut flowers";
  const filtered = Boolean(params.category || params.tag || params.q);

  const link = (active: boolean) =>
    `whitespace-nowrap border-b py-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss ${
      active ? "border-charcoal text-charcoal" : "border-transparent text-stone-dark hover:text-charcoal"
    }`;

  return (
    <main className="pb-24">
      {items.length > 0 && <JsonLd data={itemListJsonLd(items)} />}
      {page > 1 && <link rel="prev" href={listHref(params, { page: page - 1 })} />}
      {page < pages && <link rel="next" href={listHref(params, { page: page + 1 })} />}

      <Container>
        <header className="pb-10 pt-12 md:pb-14 md:pt-20">
          <Eyebrow className="mb-4">{params.q ? "Search" : "The collection"}</Eyebrow>
          <h1 className="type-h1 text-charcoal">{heading}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-dark">
            {activeCategory?.description ||
              "Hand-selected stems, bouquets and plants, cut fresh and delivered to your door."}
          </p>
          <p className="mt-6 text-sm text-stone-dark" aria-live="polite">
            {total} {total === 1 ? "product" : "products"}
            {pages > 1 ? ` · page ${page} of ${pages}` : ""}
          </p>
        </header>

        <div className="flex flex-col gap-4 border-y border-stone-light py-3 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Categories" className="-mx-5 overflow-x-auto overflow-y-hidden px-5 md:mx-0 md:px-0">
            <ul className="flex items-center gap-7">
              <li>
                <Link href={listHref({ sort: params.sort, page: 1 })} aria-current={!params.category ? "page" : undefined} className={link(!params.category)}>
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={listHref({ sort: params.sort, page: 1 }, { category: c.slug })}
                    aria-current={params.category === c.slug ? "page" : undefined}
                    className={link(params.category === c.slug)}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <SortSelect value={params.sort ?? "newest"} />
        </div>

        <div className="mt-10 md:mt-14">
          {items.length === 0 ? (
            <EmptyState
              title="No flowers match"
              body={filtered ? "Try a different category or search, or clear your filters." : "Please check back soon."}
              cta={filtered ? { href: "/products", label: "Clear filters" } : undefined}
            />
          ) : (
            <ProductGrid products={items} priorityCount={4} />
          )}
        </div>

        <Pagination params={params} page={page} pages={pages} />
      </Container>
    </main>
  );
}

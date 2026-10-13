import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { ApiCategory } from './api';
import { listCategories, listProducts, type ProductPage } from './server-api';
import { PAGE_SIZE, listHref, parseListParams, type ListParams, type RawSearchParams } from './list-params';
import { occasionForTag } from './occasions';
import { shownCategories } from './categories';
import { metaDescription, socialMeta } from './seo';

export function flattenCategories(list: ApiCategory[]): ApiCategory[] {
  return list.flatMap((c) => [c, ...flattenCategories(c.children ?? [])]);
}

export type Fixed = { category?: string; tag?: string };

export type CatalogueData = {
  params: ListParams;
  result: ProductPage;
  /** Active top-level categories (filter bar / related links). */
  categories: ApiCategory[];
  activeCategory?: ApiCategory;
};

/**
 * Where a /products?category=|tag= URL permanently lives now (ruling R9), or undefined when it stays on /products.
 * A known category alone goes to its collection and an occasion tag alone to its occasion page. A category AND a tag
 * together stay on /products (the landing pages cannot express both, and a redirect would silently drop the tag).
 * Sort, page and search are carried over; unknown values never redirect.
 */
export function landingRedirectTarget(params: ListParams, knownCategory?: ApiCategory): string | undefined {
  const rest = { category: undefined, tag: undefined } as const;
  if (params.category && params.tag) return undefined;
  if (params.category && knownCategory) {
    return listHref(params, rest, `/collections/${encodeURIComponent(knownCategory.slug)}`);
  }
  if (!params.category && params.tag) {
    const occasion = occasionForTag(params.tag);
    if (occasion) return listHref(params, rest, `/occasions/${occasion.slug}`);
  }
  return undefined;
}

/**
 * Fetches everything a listing page needs and decides the real 404s before anything streams.
 * - `fixed` pins category/tag (landing pages): those query params are ignored in favour of the path.
 * - `strict` (collections): the category list must load and contain the slug, otherwise 404 / throw.
 *   Not strict (/products, occasions): a category-list outage degrades the filter bar instead.
 */
export async function loadCatalogue(
  searchParams: RawSearchParams,
  opts: {
    fixed?: Fixed;
    strict?: boolean;
    redirectToLanding?: boolean;
    /** Landing pages: builds the canonical path for a (lower-cased) category slug, enabling the /collections/Plants redirect. */
    canonicalBasePath?: (slug: string) => string;
  } = {},
): Promise<CatalogueData> {
  const parsed = parseListParams(searchParams);
  // `params` is what links are built from. On a landing page the path already says category/tag, so
  // they are stripped (links stay /collections/roses?page=2); the API call below still gets them.
  const params: ListParams = opts.fixed ? { ...parsed, category: undefined, tag: undefined } : parsed;
  const query = opts.fixed ? { category: opts.fixed.category, tag: opts.fixed.tag } : { category: parsed.category, tag: parsed.tag };

  // Categories first: legacy URLs must redirect (and unknown slugs 404) without costing a products query,
  // and still work while the products endpoint is down.
  const categories = await (opts.strict ? listCategories() : listCategories().catch(() => [] as ApiCategory[]));
  const all = flattenCategories(categories);
  const live = (c?: ApiCategory) => (c && c.active !== false ? c : undefined);

  if (query.category && opts.canonicalBasePath && query.category !== query.category.toLowerCase()) {
    const lower = query.category.toLowerCase();
    if (live(all.find((c) => c.slug === lower))) permanentRedirect(listHref(params, {}, opts.canonicalBasePath(lower)));
    notFound();
  }

  const activeCategory = query.category ? all.find((c) => c.slug === query.category) : undefined;
  if (opts.redirectToLanding) {
    const target = landingRedirectTarget(params, live(activeCategory));
    if (target) permanentRedirect(target);
  }
  if (query.category) {
    // When the category list is unavailable (non-strict) we cannot tell, so we do not 404.
    const known = opts.strict ? live(activeCategory) : categories.length === 0 || live(activeCategory);
    if (!known) notFound();
  }

  const result = await listProducts({
    category: query.category,
    tag: query.tag,
    sort: params.sort,
    q: params.q,
    page: params.page,
    take: PAGE_SIZE,
  });
  if (result.total > 0 && params.page > result.pages) notFound();
  return { params, result, categories: shownCategories(categories.filter((c) => !c.parentId)), activeCategory };
}

/** Metadata shared by the collection and occasion landing pages. */
export function landingMetadata(args: {
  basePath: string;
  title: string;
  description: string;
  params: ListParams;
  result: ProductPage;
}): Metadata {
  const { basePath, params, result } = args;
  const pageSuffix = params.page > 1 ? ` — Page ${params.page}` : '';
  const title = `${args.title}${pageSuffix}`;
  const description = metaDescription(args.description, 155 - pageSuffix.length) + pageSuffix;
  // Search results are noindex and canonical to the landing page; sort never changes the canonical.
  const canonical = params.q || params.page <= 1 ? basePath : `${basePath}?page=${params.page}`;
  const noindex = Boolean(params.q) || result.items.length === 0;
  return {
    title,
    description,
    alternates: { canonical },
    ...socialMeta(title, description, canonical),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

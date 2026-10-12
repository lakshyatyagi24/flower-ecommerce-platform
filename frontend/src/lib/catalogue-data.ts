import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { ApiCategory } from './api';
import { listCategories, listProducts, type ProductPage } from './server-api';
import { PAGE_SIZE, listHref, parseListParams, type ListParams, type RawSearchParams } from './list-params';
import { occasionForTag } from './occasions';
import { metaDescription } from './seo';

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
 * A known category wins over a tag; sort, page and search are carried over; unknown values never redirect.
 */
export function landingRedirectTarget(params: ListParams, knownCategory?: ApiCategory): string | undefined {
  const rest = { category: undefined, tag: undefined } as const;
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
  opts: { fixed?: Fixed; strict?: boolean; redirectToLanding?: boolean } = {},
): Promise<CatalogueData> {
  const parsed = parseListParams(searchParams);
  // `params` is what links are built from. On a landing page the path already says category/tag, so
  // they are stripped (links stay /collections/roses?page=2); the API call below still gets them.
  const params: ListParams = opts.fixed ? { ...parsed, category: undefined, tag: undefined } : parsed;
  const query = opts.fixed ? { category: opts.fixed.category, tag: opts.fixed.tag } : { category: parsed.category, tag: parsed.tag };
  const [result, categories] = await Promise.all([
    listProducts({
      category: query.category,
      tag: query.tag,
      sort: params.sort,
      q: params.q,
      page: params.page,
      take: PAGE_SIZE,
    }),
    opts.strict ? listCategories() : listCategories().catch(() => [] as ApiCategory[]),
  ]);
  const all = flattenCategories(categories);
  const activeCategory = query.category ? all.find((c) => c.slug === query.category) : undefined;
  if (opts.redirectToLanding) {
    const target = landingRedirectTarget(params, activeCategory && activeCategory.active !== false ? activeCategory : undefined);
    if (target) permanentRedirect(target);
  }
  if (query.category) {
    const known = opts.strict ? activeCategory && activeCategory.active !== false : categories.length === 0 || activeCategory;
    if (!known) notFound();
  }
  if (result.total > 0 && params.page > result.pages) notFound();
  return { params, result, categories: categories.filter((c) => c.active !== false && !c.parentId), activeCategory };
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
    openGraph: { title, description, url: canonical, type: 'website' },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

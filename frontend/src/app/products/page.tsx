import type { Metadata } from "next";
import CatalogueView from "@/components/product/CatalogueView";
import { loadCatalogue } from "@/lib/catalogue-data";
import { metaDescription, socialMeta } from "@/lib/seo";
import { listHref, type RawSearchParams } from "@/lib/list-params";

// R1: never prerender at build time (the API is not reachable during `next build`).
export const dynamic = "force-dynamic";

type Props = { searchParams?: RawSearchParams };

// `?category=<known>` and `?tag=<occasion>` are permanently redirected to /collections/<slug> and
// /occasions/<slug> inside loadCatalogue (R9); what remains here is the unfiltered list, search and unknown filters.
const load = (searchParams: RawSearchParams) => loadCatalogue(searchParams, { redirectToLanding: true });

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { params, result } = await load(searchParams);
  const pageSuffix = params.page > 1 ? ` — Page ${params.page}` : "";
  const title = `Fresh Cut Flowers Online${pageSuffix}`;
  const description =
    metaDescription(
      "Shop fresh cut flowers online from Fresh Petals India. Choose your stems and have them delivered across Delhi NCR.",
      155 - pageSuffix.length,
    ) + pageSuffix;
  // Canonical keeps the filters that change the product set (category, tag, page) and drops sort/search.
  const canonical = params.q ? "/products" : listHref({ category: params.category, tag: params.tag, page: params.page });
  const noindex = Boolean(params.q) || result.items.length === 0;
  return {
    title,
    description,
    alternates: { canonical },
    ...socialMeta(title, description, canonical),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const { params, result, categories } = await load(searchParams);
  const heading = params.q ? `Results for “${params.q}”` : "Fresh cut flowers";
  return (
    <CatalogueView
      basePath="/products"
      params={params}
      result={result}
      categories={categories}
      activeCategorySlug={params.category}
      eyebrow={params.q ? "Search" : "The collection"}
      heading={heading}
      intro="Fresh cut flowers, ready to order online and delivered to your door."
      filtered={Boolean(params.category || params.tag || params.q)}
    />
  );
}

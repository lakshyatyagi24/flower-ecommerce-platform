import type { Metadata } from "next";
import CatalogueView from "@/components/product/CatalogueView";
import RelatedLinks from "@/components/product/RelatedLinks";
import { landingMetadata, loadCatalogue } from "@/lib/catalogue-data";
import { collectionTitle } from "@/lib/categories";
import type { RawSearchParams } from "@/lib/list-params";

// R1: never prerender at build time (the API is not reachable during `next build`).
export const dynamic = "force-dynamic";

type Props = { params: { slug: string }; searchParams?: RawSearchParams };

/** Short neutral line for a category the admin has not described yet. */
const fallbackIntro = (name: string) => `Browse our ${name} — hand-selected stems and arrangements.`;

// strict: an unknown slug is a real 404 and a category-list outage is an error page, never a soft 200.
const load = (slug: string, searchParams: RawSearchParams) =>
  loadCatalogue(searchParams, {
    fixed: { category: slug },
    strict: true,
    // /collections/Plants -> 308 /collections/plants when that category exists, else 404.
    canonicalBasePath: (lower) => `/collections/${encodeURIComponent(lower)}`,
  });

export async function generateMetadata({ params: { slug }, searchParams }: Props): Promise<Metadata> {
  const { params, result, activeCategory } = await load(slug, searchParams);
  const name = activeCategory!.name;
  return landingMetadata({
    basePath: `/collections/${slug}`,
    // The layout template appends " · Fresh Petals India", so the brand is not repeated here.
    // Purchasable categories say Buy, enquiry-only ones say Enquire.
    title: collectionTitle(activeCategory!),
    description: activeCategory!.description?.trim() || fallbackIntro(name),
    params,
    result,
  });
}

export default async function CollectionPage({ params: { slug }, searchParams }: Props) {
  const { params, result, categories, activeCategory } = await load(slug, searchParams);
  const name = activeCategory!.name;
  const basePath = `/collections/${slug}`;
  return (
    <CatalogueView
      basePath={basePath}
      params={params}
      result={result}
      categories={categories}
      activeCategorySlug={slug}
      eyebrow="The collection"
      heading={name}
      intro={activeCategory!.description?.trim() || fallbackIntro(name)}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name, path: basePath },
      ]}
      filtered={Boolean(params.q)}
      empty={
        params.q
          ? {
              title: "No flowers match",
              body: "Try a different search, or clear your filters.",
              cta: { href: basePath, label: "Clear filters" },
            }
          : {
              title: "New stems coming soon",
              body: "We are adding to this collection. Browse all our flowers in the meantime.",
              cta: { href: "/products", label: "Browse all flowers" },
            }
      }
      related={<RelatedLinks collections={categories} currentCollection={slug} />}
    />
  );
}

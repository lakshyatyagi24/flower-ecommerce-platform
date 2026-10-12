import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CatalogueView from "@/components/product/CatalogueView";
import RelatedLinks from "@/components/product/RelatedLinks";
import { landingMetadata, loadCatalogue } from "@/lib/catalogue-data";
import { getOccasion } from "@/lib/occasions";
import { listHref, parseListParams, type RawSearchParams } from "@/lib/list-params";

// R1: never prerender at build time (the API is not reachable during `next build`).
export const dynamic = "force-dynamic";

type Props = { params: { slug: string }; searchParams?: RawSearchParams };

async function load(slug: string, searchParams: RawSearchParams) {
  const occasion = getOccasion(slug);
  if (!occasion) {
    // /occasions/Birthday -> 308 /occasions/birthday; anything else is a real 404.
    const lower = slug.toLowerCase();
    if (lower !== slug && getOccasion(lower)) {
      const p = parseListParams(searchParams);
      permanentRedirect(listHref({ ...p, category: undefined, tag: undefined }, {}, `/occasions/${lower}`));
    }
    notFound();
  }
  return { occasion, ...(await loadCatalogue(searchParams, { fixed: { tag: occasion.tag } })) };
}

export async function generateMetadata({ params: { slug }, searchParams }: Props): Promise<Metadata> {
  const { occasion, params, result } = await load(slug, searchParams);
  return landingMetadata({
    basePath: `/occasions/${occasion.slug}`,
    title: occasion.title,
    description: occasion.metaDescription,
    params,
    result,
  });
}

export default async function OccasionPage({ params: { slug }, searchParams }: Props) {
  const { occasion, params, result, categories } = await load(slug, searchParams);
  const basePath = `/occasions/${occasion.slug}`;
  return (
    <CatalogueView
      basePath={basePath}
      params={params}
      result={result}
      eyebrow={occasion.eyebrow ?? "Shop by occasion"}
      heading={`${occasion.name} flowers`}
      intro={occasion.intro}
      breadcrumb={[
        { name: "Home", path: "/" },
        { name: `${occasion.name} flowers`, path: basePath },
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
              body: "We are still choosing flowers for this occasion. Browse all our flowers in the meantime.",
              cta: { href: "/products", label: "Browse all flowers" },
            }
      }
      related={<RelatedLinks collections={categories} currentOccasion={occasion.slug} />}
    />
  );
}

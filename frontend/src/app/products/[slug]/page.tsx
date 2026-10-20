import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import JsonLd from "@/components/JsonLd";
import ProductGrid from "@/components/product/ProductGrid";
import ProductReviews from "@/components/ProductReviewsLazy";
import { getProduct, getSettings, listProducts } from "@/lib/server-api";
import { breadcrumbJsonLd, metaDescription, productFactsDescription, productJsonLd } from "@/lib/seo";
import { uspsFromSettings } from "@/lib/product-helpers";
import { ogPhotoUrl } from "@/lib/og";
import type { ApiProduct } from "@/lib/api";
import ProductInfo from "./_components/ProductInfo";
import { Breadcrumbs, ProductImage, type Crumb } from "./_components/ProductMedia";

// R1: never prerender at build time (the API is not reachable during `next build`).
export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

const TITLE_SUFFIX: Record<string, string> = {
  CUT_FLOWER: "Fresh Cut Flowers",
  PLANT: "Indoor Plants",
  BOUQUET: "Flower Bouquets",
  ARRANGEMENT: "Flower Arrangements",
  HAMPER: "Gift Hampers",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product || product.active === false) {
    // Throwing here (before the shell streams) is what makes the HTTP status a real 404.
    notFound();
  }
  const title = `${product.name} — ${TITLE_SUFFIX[product.productType ?? ""] ?? "Fresh Cut Flowers"}`;
  // Structured facts only; never the imported product.description (see productFactsDescription).
  const description = metaDescription(productFactsDescription(product, { city: await safeCity() }));
  const path = `/products/${product.slug}`;
  // Real photo: explicit 1200x630 Cloudinary JPEG (small enough for WhatsApp/Facebook).
  // No real photo: no explicit images, so the file-based generated text card is used.
  const photo = ogPhotoUrl(product.image);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: "Fresh Petals India",
      locale: "en_IN",
      ...(photo ? { images: [{ url: photo, width: 1200, height: 630, alt: product.name }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(photo ? { images: [photo] } : {}) },
  };
}

async function safeRelated(product: ApiProduct): Promise<ApiProduct[]> {
  if (!product.category?.slug) return [];
  try {
    const res = await listProducts({ category: product.category.slug, take: 5 });
    return res.items.filter((p) => p.id !== product.id && p.active !== false).slice(0, 4);
  } catch {
    return []; // secondary section: hide rather than fail the page
  }
}

function cityFromSettings(settings: Record<string, string>): string | null {
  const first = (settings?.["delivery.supportedCities"] ?? "").split(",")[0]?.trim();
  return first || null;
}

async function safeCity(): Promise<string | null> {
  return cityFromSettings(await safeSettings());
}

async function safeSettings(): Promise<Record<string, string>> {
  try {
    return await getSettings();
  } catch {
    return {};
  }
}

function breadcrumbsFor(product: ApiProduct): Crumb[] {
  return [
    { name: "Home", path: "/" },
    ...(product.category ? [{ name: product.category.name, path: `/collections/${product.category.slug}` }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];
}

export default async function ProductPage({ params }: Params) {
  const product = await getProduct(params.slug);
  if (!product || product.active === false) notFound();

  const [related, settings] = await Promise.all([safeRelated(product), safeSettings()]);
  const productLd = productJsonLd(product, { city: cityFromSettings(settings) });
  const crumbs = breadcrumbsFor(product);

  return (
    <main className="pb-24">
      {productLd && <JsonLd data={productLd} />}
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <Container>
        <Breadcrumbs crumbs={crumbs} />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
          <ProductImage product={product} />
          <ProductInfo product={product} usps={uspsFromSettings(settings)} settings={settings} />
        </div>

        <section id="reviews" className="mt-24 scroll-mt-24">
          <ProductReviews productId={product.id} />
        </section>

        <RelatedProducts products={related} />
      </Container>
    </main>
  );
}

function RelatedProducts({ products }: { products: ApiProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-24" aria-labelledby="related-heading">
      <h2 id="related-heading" className="type-h2 mb-10 text-charcoal">
        You may also love
      </h2>
      <ProductGrid products={products} headingLevel={3} />
    </section>
  );
}

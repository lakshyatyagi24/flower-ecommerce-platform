import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Price from "@/components/ui/Price";
import JsonLd from "@/components/JsonLd";
import Accordion from "@/components/product/Accordion";
import ProductBuyBox from "@/components/product/ProductBuyBox";
import ProductGrid from "@/components/product/ProductGrid";
import Stars from "@/components/product/Stars";
import ProductReviews from "@/components/ProductReviewsLazy";
import { getProduct, getSettings, listProducts } from "@/lib/server-api";
import { breadcrumbJsonLd, metaDescription, productFactsDescription, productJsonLd } from "@/lib/seo";
import { splitDescription } from "@/lib/description";
import { careCopy, uspsFromSettings } from "@/lib/product-helpers";
import { productImage } from "@/lib/product-image";
import { ogPhotoUrl } from "@/lib/og";
import type { ApiProduct } from "@/lib/api";

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

export default async function ProductPage({ params }: Params) {
  const product = await getProduct(params.slug);
  if (!product || product.active === false) notFound();

  const [related, settings] = await Promise.all([safeRelated(product), safeSettings()]);

  const isEnquiry = product.saleMode === "ENQUIRY";
  const unit = product.unit && product.unit !== "piece" ? `/ ${product.unit}` : undefined;
  const minOrderQty = product.minOrderQty && product.minOrderQty > 0 ? product.minOrderQty : 1;
  const { lead, rest } = splitDescription(product.description);
  const usps = uspsFromSettings(settings);
  const deliverySummary = settings["policies.deliverySummary"]?.trim();
  const returnsSummary = settings["policies.returnsSummary"]?.trim();
  const reviewCount = product.reviewCount ?? 0;
  const rating = product.averageRating ?? 0;
  const productLd = productJsonLd(product, { city: cityFromSettings(settings) });

  const crumbs = [
    { name: "Home", path: "/" },
    ...(product.category ? [{ name: product.category.name, path: `/collections/${product.category.slug}` }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <main className="pb-24">
      {productLd && <JsonLd data={productLd} />}
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <Container>
        <nav aria-label="Breadcrumb" className="py-6 text-xs text-stone-dark">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={c.path} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-stone-light" />}
                  {last ? (
                    <span aria-current="page" className="text-charcoal">
                      {c.name}
                    </span>
                  ) : (
                    <Link href={c.path} className="hover:text-charcoal hover:underline underline-offset-4">
                      {c.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
          <div className="md:sticky md:top-24 md:self-start">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ivory-deep">
              <Image
                src={productImage(product)}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="md:py-4">
            {product.category && <Eyebrow className="mb-4">{product.category.name}</Eyebrow>}
            <h1 className="type-h1 text-charcoal">{product.name}</h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              {isEnquiry ? (
                <span className="text-xl text-charcoal">Price on enquiry</span>
              ) : (
                <>
                  <Price amount={product.price} unit={unit} className="text-2xl" />
                  <span className="text-xs text-stone-dark">
                    {product.gstRate && product.gstRate > 0 ? `+ ${product.gstRate}% GST` : "No GST"}
                  </span>
                </>
              )}
            </div>

            {reviewCount > 0 && (
              <a
                href="#reviews"
                className="mt-4 inline-flex items-center gap-2 text-sm text-stone-dark hover:text-charcoal"
                aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} review${reviewCount === 1 ? "" : "s"}`}
              >
                <Stars value={rating} />
                <span>
                  {rating.toFixed(1)} · {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </span>
              </a>
            )}

            {lead && <p className="mt-6 text-base leading-relaxed text-stone-dark">{lead}</p>}

            <div className="mt-8 border-t border-stone-light pt-8">
              <ProductBuyBox product={product} />
            </div>

            <ul className="mt-8 divide-y divide-stone-light border-y border-stone-light text-sm">
              {usps.map((u) => (
                <li key={u.title} className="py-4">
                  <span className="text-charcoal">{u.title}</span>
                  {u.body && <span className="text-stone-dark"> — {u.body}</span>}
                </li>
              ))}
            </ul>

            <div className="mt-2">
              <Accordion title="Details" open>
                {rest.map((b, i) =>
                  b.heading ? (
                    <p key={i} className="pt-2 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal">
                      {b.text}
                    </p>
                  ) : (
                    <p key={i}>{b.text}</p>
                  ),
                )}
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                  {product.category && (
                    <>
                      <dt>Category</dt>
                      <dd className="text-charcoal">{product.category.name}</dd>
                    </>
                  )}
                  <dt>Sold by</dt>
                  <dd className="text-charcoal">{product.unit || "piece"}</dd>
                  {minOrderQty > 1 && (
                    <>
                      <dt>Minimum order</dt>
                      <dd className="text-charcoal">{minOrderQty}</dd>
                    </>
                  )}
                </dl>
              </Accordion>
              <Accordion title="Care">
                {careCopy(product.productType).map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </Accordion>
              <Accordion title="Delivery & returns">
                {deliverySummary && <p>{deliverySummary}</p>}
                {returnsSummary && <p>{returnsSummary}</p>}
                <p>
                  Flowers are perishable.{" "}
                  <Link href="/refund-policy" className="text-charcoal underline underline-offset-4">
                    Read our refund policy
                  </Link>{" "}
                  for what to do if your order arrives damaged.
                </p>
              </Accordion>
            </div>
          </div>
        </div>

        <section id="reviews" className="mt-24 scroll-mt-24">
          <ProductReviews productId={product.id} />
        </section>

        {related.length > 0 && (
          <section className="mt-24" aria-labelledby="related-heading">
            <h2 id="related-heading" className="type-h2 mb-10 text-charcoal">
              You may also love
            </h2>
            <ProductGrid products={related} headingLevel={3} />
          </section>
        )}
      </Container>
    </main>
  );
}

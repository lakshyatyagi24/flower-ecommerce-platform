import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Price from "@/components/ui/Price";
import JsonLd from "@/components/JsonLd";
import ProductBuyBox from "@/components/product/ProductBuyBox";
import ProductGrid from "@/components/product/ProductGrid";
import ProductReviews from "@/components/ProductReviews";
import { getProduct, getSettings, listProducts } from "@/lib/server-api";
import { absoluteUrl, breadcrumbJsonLd, metaDescription, productJsonLd } from "@/lib/seo";
import { productImage } from "@/lib/product-image";
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
  const description =
    metaDescription(product.description) ||
    `Order ${product.name} online from Fresh Petals India. Farm-fresh flowers, delivered fresh.`;
  const path = `/products/${product.slug}`;
  const image = absoluteUrl(productImage(product));
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website", images: [{ url: image, alt: product.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

type Block = { text: string; heading: boolean };

// Catalogue copy often uses short label lines ("What you get", "Size it right") between paragraphs.
// Those are headings, never the lead sentence.
function splitDescription(text: string | null): { lead: string; rest: Block[] } {
  const blocks: Block[] = (text ?? "")
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ text: t, heading: t.split(/\s+/).length <= 6 && !/[.!?]$/.test(t) }));
  const leadIdx = blocks.findIndex((b) => !b.heading);
  if (leadIdx === -1) return { lead: "", rest: blocks };
  return { lead: blocks[leadIdx].text, rest: blocks.filter((_, i) => i !== leadIdx) };
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 text-charcoal" fill={i < full ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
          <path d="M10 1.8l2.5 5.3 5.7.7-4.2 4 1.1 5.7L10 14.7 4.9 17.5 6 11.8 1.8 7.8l5.7-.7z" />
        </svg>
      ))}
    </span>
  );
}

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-stone-light">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="text-lg font-normal text-stone transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-3 pb-6 text-sm leading-relaxed text-stone-dark">{children}</div>
    </details>
  );
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
  const cutoff = settings["delivery.cutoffTime"]?.trim();
  const reviewCount = product.reviewCount ?? 0;
  const rating = product.averageRating ?? 0;

  const crumbs = [
    { name: "Home", path: "/" },
    ...(product.category ? [{ name: product.category.name, path: `/products?category=${product.category.slug}` }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <main className="pb-24">
      <JsonLd data={productJsonLd(product)} />
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
              <ProductBuyBox
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  stock: product.stock,
                  saleMode: product.saleMode,
                  gstRate: product.gstRate,
                  minOrderQty: product.minOrderQty,
                  unit: product.unit,
                }}
              />
            </div>

            <ul className="mt-8 divide-y divide-stone-light border-y border-stone-light text-sm">
              <li className="py-4">
                <span className="text-charcoal">Freshness guarantee</span>
                <span className="text-stone-dark"> — cut fresh and packed to arrive in bloom.</span>
              </li>
              <li className="py-4">
                <span className="text-charcoal">Same-day delivery</span>
                <span className="text-stone-dark">
                  {cutoff ? ` — order before ${cutoff}.` : " — order early in the day for same-day delivery."}
                </span>
              </li>
            </ul>

            <div className="mt-2">
              <Accordion title="Details" open>
                {rest.map((b, i) =>
                  b.heading ? (
                    <h3 key={i} className="pt-2 font-sans! text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal">
                      {b.text}
                    </h3>
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
                <p>Trim the stems at an angle and place them in clean, cool water as soon as they arrive.</p>
                <p>Change the water every two days and keep the stems away from direct sun, heat and ripening fruit.</p>
              </Accordion>
              <Accordion title="Delivery & returns">
                <p>
                  {cutoff
                    ? `Orders placed before ${cutoff} are eligible for same-day delivery where available.`
                    : "Orders placed early in the day are eligible for same-day delivery where available."}
                </p>
                <p>
                  Flowers are perishable. If your order arrives damaged, tell us within 24 hours with a photo and we will make it right.{" "}
                  <Link href="/refund-policy" className="text-charcoal underline underline-offset-4">
                    Read our refund policy
                  </Link>
                  .
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
            <ProductGrid products={related} />
          </section>
        )}
      </Container>
    </main>
  );
}

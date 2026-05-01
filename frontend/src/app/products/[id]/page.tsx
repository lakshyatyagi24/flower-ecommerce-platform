"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiProduct, api } from "@/lib/api";
import { useCart, formatINR } from "@/lib/cart-context";
import ProductReviews from "@/components/ProductReviews";
import EnquiryModal from "@/components/EnquiryModal";

const RatingStar: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg
    className={`w-4 h-4 ${filled ? "text-amber-400" : "text-amber-200"}`}
    viewBox="0 0 20 20"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    aria-hidden
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const slug = params?.id;
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; reviewCount: number } | null>(null);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const { add } = useCart();

  const handleReviewStats = useCallback(
    (stats: { averageRating: number; reviewCount: number }) => setReviewStats(stats),
    [],
  );

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getProductBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        // Seed quantity at the product's minOrderQty so the user can't accidentally add fewer.
        const minQty = p.minOrderQty && p.minOrderQty > 0 ? p.minOrderQty : 1;
        setQuantity(minQty);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="section-shell mt-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
          <div className="bg-slate-200 rounded-3xl h-[480px] lg:h-[560px]" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="h-10 bg-slate-200 rounded w-1/2 mt-6" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="section-shell mt-12 mb-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Product not found</h1>
        <p className="mt-2 text-slate-700">{error || "We couldn't find this product."}</p>
        <Link href="/products" className="mt-6 inline-block text-olive-green font-semibold underline-offset-4 hover:underline">
          Back to all florals
        </Link>
      </main>
    );
  }

  const isEnquiry = product.saleMode === "ENQUIRY";
  const outOfStock = !isEnquiry && product.stock === 0 && product.stock !== undefined;
  const averageRating = reviewStats?.averageRating ?? product.averageRating ?? 0;
  const reviewCount = reviewStats?.reviewCount ?? product.reviewCount ?? 0;
  const minOrderQty = product.minOrderQty && product.minOrderQty > 0 ? product.minOrderQty : 1;
  const unitLabel = product.unit && product.unit !== "piece" ? product.unit : null;

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="relative w-full h-[480px] lg:h-[560px] bg-white rounded-3xl overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.14)]">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-9xl">🌸</div>
          )}
          {product.featured && <div className="absolute top-4 left-4 pill">Featured</div>}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            {product.category && <p className="pill mb-3">{product.category.name}</p>}
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">{product.name}</h1>
            <a
              href="#product-reviews"
              className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700 hover:text-olive-green"
              aria-label={
                reviewCount > 0
                  ? `Rated ${averageRating.toFixed(1)} out of 5 from ${reviewCount} reviews`
                  : "No reviews yet"
              }
            >
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <RatingStar key={i} filled={i < Math.round(averageRating)} />
                ))}
              </span>
              <span>
                {reviewCount > 0
                  ? `${averageRating.toFixed(1)} · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </span>
            </a>
            <p className="mt-3 text-slate-700 leading-relaxed">
              {product.description ??
                "Luxe florals wrapped in velvet ribbons with layered hues, hand delivered with our signature keepsake packaging."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isEnquiry ? (
              <span className="text-lg font-semibold text-olive-green">Custom quote on enquiry</span>
            ) : (
              <>
                <span className="text-2xl font-bold text-olive-green">
                  {formatINR(product.price)}
                  {unitLabel ? <span className="ml-2 text-sm font-normal text-olive-green/70">/ {unitLabel}</span> : null}
                </span>
                {product.gstRate && product.gstRate > 0 ? (
                  <span className="text-sm uppercase tracking-[0.16em] text-olive-green/70">+ {product.gstRate}% GST</span>
                ) : (
                  <span className="text-sm uppercase tracking-[0.16em] text-olive-green/70">No GST · raw cut flowers</span>
                )}
              </>
            )}
          </div>

          {isEnquiry ? (
            <div className="rounded-2xl border border-olive-green/20 bg-olive-green/5 p-4 text-sm text-slate-700">
              This product is built to order. Send us an enquiry with your quantity, date and budget — we&apos;ll call you back to confirm pricing and availability.
            </div>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700 bg-white/70 border border-olive-green/10 rounded-2xl p-4">
              <li>• Sourced fresh from the mandi every morning</li>
              <li>• Cab/bike delivery across Delhi NCR</li>
              <li>• Bulk pricing available for corporate orders</li>
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {isEnquiry ? (
              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                Enquire now
              </button>
            ) : (
              <>
                <div className="inline-flex items-center border border-olive-green/20 rounded-full overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(minOrderQty, q - 1))}
                    className="px-3 py-2 text-olive-green hover:bg-olive-green/5"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="px-4 font-medium" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-olive-green hover:bg-olive-green/5"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() =>
                    add(
                      {
                        productId: product.id,
                        slug: product.slug,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        saleMode: product.saleMode,
                        gstRate: product.gstRate,
                      },
                      quantity,
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {outOfStock ? "Out of stock" : "Add to cart"}
                </button>
              </>
            )}
            <Link href="/products" className="text-olive-green font-semibold underline-offset-4 hover:underline">
              Back to collections
            </Link>
          </div>

          {!isEnquiry && product.stock > 0 && product.stock < 10 && (
            <p className="text-sm text-amber-700">Only {product.stock} left in stock.</p>
          )}
          {minOrderQty > 1 && !isEnquiry ? (
            <p className="text-xs text-gray-500">Minimum order: {minOrderQty} {unitLabel || "units"}.</p>
          ) : null}
        </div>
      </div>

      <div id="product-reviews">
        <ProductReviews productId={product.id} onStatsChange={handleReviewStats} />
      </div>

      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        productId={product.id}
        productName={product.name}
        source={`product:${product.slug}`}
        heading={`Enquire about ${product.name}`}
      />
    </main>
  );
}

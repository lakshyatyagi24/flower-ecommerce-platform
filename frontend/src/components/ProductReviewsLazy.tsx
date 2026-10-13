"use client";

import dynamic from "next/dynamic";
import Eyebrow from "@/components/ui/Eyebrow";

// Reviews sit far below the fold and are fetched client-side anyway, so their code is split out of the PDP's
// first-load bundle. The fallback is server-rendered: it keeps the "Customer reviews" heading in the HTML and
// reserves roughly the loaded height so the sections below do not jump when the real list arrives.
const ProductReviews = dynamic(() => import("./ProductReviews"), {
  ssr: false,
  loading: () => (
    <section className="mt-16 min-h-[320px] border-t border-stone-light pt-12 md:mt-24 md:min-h-[400px] md:pt-16">
      <Eyebrow>Reviews</Eyebrow>
      <h2 className="type-h2 mt-3 text-charcoal">Customer reviews</h2>
    </section>
  ),
});

export default function ProductReviewsLazy({ productId }: { productId: number }) {
  return <ProductReviews productId={productId} />;
}

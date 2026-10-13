"use client";

import dynamic from "next/dynamic";

// Reviews sit far below the fold and are fetched client-side anyway, so their code is split out of the PDP's
// first-load bundle. The placeholder reserves height so the section below does not jump when it arrives.
const ProductReviews = dynamic(() => import("./ProductReviews"), {
  ssr: false,
  loading: () => <div aria-hidden className="min-h-[240px]" />,
});

export default function ProductReviewsLazy({ productId }: { productId: number }) {
  return <ProductReviews productId={productId} />;
}

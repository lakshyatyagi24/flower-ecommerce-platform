"use client";

import React, { useId } from "react";
import { useAuth } from "@/lib/auth-context";
import Eyebrow from "@/components/ui/Eyebrow";
import { OwnReviewNotice, ReviewList } from "./reviews/ReviewList";
import { StarRow } from "./reviews/stars";
import { useReviewEligibility, useReviewForm, useReviewList } from "./reviews/use-reviews";
import WriteReviewPanel from "./reviews/WriteReviewPanel";

export { NOT_ELIGIBLE_MESSAGE, RATE_LIMIT_MESSAGE, THANKS_MESSAGE, UNCHANGED_MESSAGE } from "./reviews/review-logic";

interface Props {
  productId: number;
  onStatsChange?: (stats: { averageRating: number; reviewCount: number }) => void;
}

function RatingSummary({ averageRating, total }: { averageRating: number; total: number }) {
  if (total === 0) return null;
  return (
    <div className="mt-4 flex items-center gap-3 text-sm text-stone-dark">
      <StarRow value={averageRating} />
      <span>
        {averageRating.toFixed(1)} · {total} review{total === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export default function ProductReviews({ productId, onStatsChange }: Props) {
  const { user } = useAuth();
  const uid = useId();
  const list = useReviewList(productId, user?.id ?? null, onStatsChange);
  const eligibility = useReviewEligibility(productId, user?.id ?? null);
  const form = useReviewForm({
    productId,
    ownReview: list.ownReview,
    reload: list.load,
    markIneligible: eligibility.markIneligible,
  });

  return (
    <section className="mt-16 border-t border-stone-light pt-12 md:mt-24 md:pt-16" aria-labelledby={`${uid}-reviews`}>
      <Eyebrow>Reviews</Eyebrow>
      <h2 id={`${uid}-reviews`} className="type-h2 mt-3 text-charcoal">
        Customer reviews
      </h2>
      <RatingSummary averageRating={list.averageRating} total={list.total} />
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[7fr_4fr] lg:gap-20">
        <div>
          {list.ownReview && <OwnReviewNotice review={list.ownReview} />}
          <ReviewList items={list.items} loading={list.loading} error={list.error} />
        </div>
        <WriteReviewPanel
          signedIn={Boolean(user)}
          checking={eligibility.checking}
          canWrite={Boolean(user) && eligibility.canWrite}
          ownReview={list.ownReview}
          form={form}
        />
      </div>
    </section>
  );
}

import React from "react";
import type { ApiReview } from "@/lib/api";
import { StarRow } from "./stars";
import { formatDate } from "./review-logic";

const reviewBody = "mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-charcoal";

/** The author's own review while it is not public (pending or rejected). Approved ones are in the list. */
export function OwnReviewNotice({ review }: { review: ApiReview }) {
  if (review.status !== "PENDING" && review.status !== "REJECTED") return null;
  const pending = review.status === "PENDING";
  return (
    <div className="mb-8 border border-stone p-5" data-testid="own-review">
      <p className="text-sm font-medium text-charcoal">Your review</p>
      <p className="mt-1 text-sm text-stone-dark">
        {pending
          ? "Awaiting approval. It will appear here once we have had a quick look."
          : "This review wasn't published. You can edit it and send it in again."}
      </p>
      <div className="mt-3">
        <StarRow value={review.rating} />
      </div>
      {review.title && <h3 className="mt-3 font-display text-xl text-charcoal">{review.title}</h3>}
      <p className={reviewBody}>{review.body}</p>
    </div>
  );
}

function ReviewItem({ review }: { review: ApiReview }) {
  return (
    <li className="border-b border-stone-light py-6">
      <article>
        <div className="flex items-center justify-between gap-4">
          <p className="text-base font-medium text-charcoal">{review.user?.name?.trim() || "Anonymous"}</p>
          <p className="text-sm text-stone-dark">{formatDate(review.createdAt)}</p>
        </div>
        <div className="mt-2">
          <StarRow value={review.rating} />
        </div>
        {review.title && <h3 className="mt-3 font-display text-xl text-charcoal">{review.title}</h3>}
        <p className={reviewBody}>{review.body}</p>
      </article>
    </li>
  );
}

type ReviewListProps = { items: ApiReview[]; loading: boolean; error: string | null };

export function ReviewList({ items, loading, error }: ReviewListProps) {
  if (loading) return <p className="text-base text-stone-dark">Loading reviews…</p>;
  if (error) return <p className="text-base text-danger">{error}</p>;
  if (items.length === 0) {
    return (
      <p className="text-base leading-relaxed text-stone-dark">
        No reviews yet. Reviews from customers who have received this product will appear here.
      </p>
    );
  }
  return (
    <ul className="border-t border-stone-light">
      {items.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}
    </ul>
  );
}

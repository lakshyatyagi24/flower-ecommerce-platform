"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { ApiError, ApiReview, ApiReviewEligibility, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { requestSignIn } from "@/lib/sign-in-request";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Field from "@/components/ui/Field";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { focusRing, textLink } from "@/components/ui/form-styles";

const Star: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 16 }) => (
  <svg
    className={filled ? "text-moss" : "text-stone"}
    style={{ width: size, height: size }}
    viewBox="0 0 20 20"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.2}
    aria-hidden
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} filled={i < Math.round(value)} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            aria-label={`${v} star${v === 1 ? "" : "s"}`}
            aria-pressed={v === value}
            className={`inline-flex h-11 w-11 items-center justify-center ${focusRing}`}
          >
            <Star filled={v <= value} size={24} />
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

const TITLE_MAX = 100;
const BODY_MAX = 1000;
const BODY_MIN = 10;

export const THANKS_MESSAGE = "Thanks — your review will appear after a quick check";
export const UNCHANGED_MESSAGE = "Your review is unchanged.";
export const RATE_LIMIT_MESSAGE = "You've sent a few in a row; please wait a minute.";
export const NOT_ELIGIBLE_MESSAGE = "Reviews are open to customers who have received this product.";

interface Props {
  productId: number;
  onStatsChange?: (stats: { averageRating: number; reviewCount: number }) => void;
}

/** The author's own review while it is not public (pending or rejected). Approved ones are in the list. */
function OwnReviewNotice({ review }: { review: ApiReview }) {
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
      <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-charcoal">{review.body}</p>
    </div>
  );
}

export default function ProductReviews({ productId, onStatsChange }: Props) {
  const { user } = useAuth();
  const uid = useId();
  const [items, setItems] = useState<ApiReview[]>([]);
  const [ownReview, setOwnReview] = useState<ApiReview | null>(null);
  const [eligibility, setEligibility] = useState<ApiReviewEligibility | null>(null);
  const [eligibilityFailed, setEligibilityFailed] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [thanks, setThanks] = useState("");

  const userId = user?.id ?? null;
  const statsCb = useRef(onStatsChange);
  statsCb.current = onStatsChange;

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await api.listProductReviews(productId, { take: 20 });
        setItems(res.items);
        setOwnReview(userId ? (res.ownReview ?? null) : null);
        setAverageRating(res.averageRating ?? 0);
        setTotal(res.total);
        statsCb.current?.({ averageRating: res.averageRating ?? 0, reviewCount: res.total });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    },
    [productId, userId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Can this person review? Asked of the API so a shopper who cannot is told why, instead of meeting a 403 after typing.
  useEffect(() => {
    setEligibility(null);
    setEligibilityFailed(false);
    if (userId === null) return;
    let cancelled = false;
    api
      .getReviewEligibility(productId)
      .then((e) => {
        if (!cancelled) setEligibility(e);
      })
      .catch(() => {
        if (!cancelled) setEligibilityFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, userId]);

  useEffect(() => {
    if (ownReview) {
      setRating(ownReview.rating);
      setTitle(ownReview.title ?? "");
      setBody(ownReview.body);
    }
  }, [ownReview?.id, ownReview?.rating, ownReview?.title, ownReview?.body]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setBodyError(null);
    setThanks("");
    if (body.trim().length < BODY_MIN) {
      setBodyError(body.trim() ? `Please write at least ${BODY_MIN} characters.` : "Please write a short review.");
      return;
    }
    setSubmitting(true);
    try {
      const saved = await api.upsertProductReview(productId, {
        rating,
        title: title.trim() || null,
        body: body.trim(),
      });
      // Only say "a quick check" when the review actually went into the queue; an identical re-submit keeps its status.
      setThanks(saved?.status === "PENDING" ? THANKS_MESSAGE : UNCHANGED_MESSAGE);
      await load(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        // The server disagrees with the eligibility check: explain the rule rather than show a raw error.
        setEligibility({ canReview: false, hasReview: false });
      } else if (err instanceof ApiError && err.status === 429) {
        setSubmitError(RATE_LIMIT_MESSAGE);
      } else {
        setSubmitError(err instanceof ApiError ? err.message : "Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ownReview) return;
    if (!confirm("Delete your review?")) return;
    try {
      await api.deleteReview(ownReview.id);
      setTitle("");
      setBody("");
      setRating(5);
      setThanks("");
      await load(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to delete review");
    }
  };

  // The form shows unless we positively know this person cannot review. If the eligibility lookup itself failed,
  // the server still decides on submit.
  const canWrite = !!user && (eligibility ? eligibility.canReview : eligibilityFailed);
  const checkingEligibility = !!user && !eligibility && !eligibilityFailed;

  return (
    <section className="mt-16 border-t border-stone-light pt-12 md:mt-24 md:pt-16" aria-labelledby={`${uid}-reviews`}>
      <Eyebrow>Reviews</Eyebrow>
      <h2 id={`${uid}-reviews`} className="type-h2 mt-3 text-charcoal">
        Customer reviews
      </h2>
      {total > 0 && (
        <div className="mt-4 flex items-center gap-3 text-sm text-stone-dark">
          <StarRow value={averageRating} />
          <span>
            {averageRating.toFixed(1)} · {total} review{total === 1 ? "" : "s"}
          </span>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[7fr_4fr] lg:gap-20">
        <div>
          {ownReview && <OwnReviewNotice review={ownReview} />}
          {loading ? (
            <p className="text-base text-stone-dark">Loading reviews…</p>
          ) : error ? (
            <p className="text-base text-danger">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-base leading-relaxed text-stone-dark">
              No reviews yet. Reviews from customers who have received this product will appear here.
            </p>
          ) : (
            <ul className="border-t border-stone-light">
              {items.map((r) => (
                <li key={r.id} className="border-b border-stone-light py-6">
                  <article>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-base font-medium text-charcoal">{r.user?.name?.trim() || "Anonymous"}</p>
                      <p className="text-sm text-stone-dark">{formatDate(r.createdAt)}</p>
                    </div>
                    <div className="mt-2">
                      <StarRow value={r.rating} />
                    </div>
                    {r.title && <h3 className="mt-3 font-display text-xl text-charcoal">{r.title}</h3>}
                    <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-charcoal">{r.body}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="type-h3 text-charcoal">{ownReview ? (canWrite ? "Edit your review" : "Your review") : "Write a review"}</h3>
          {/* Always mounted so screen readers announce the text when it appears. */}
          <p role="status" aria-live="polite" className={thanks ? "mt-3 text-base leading-relaxed text-moss" : "sr-only"}>
            {thanks}
          </p>
          {!user ? (
            <p className="mt-3 text-base leading-relaxed text-stone-dark">
              {NOT_ELIGIBLE_MESSAGE}{" "}
              <button type="button" className={textLink} onClick={(e) => requestSignIn(e.currentTarget)}>
                Sign in
              </button>{" "}
              to review a product you have received.
            </p>
          ) : checkingEligibility ? (
            <p className="mt-3 text-base text-stone-dark">Checking…</p>
          ) : !canWrite ? (
            <div className="mt-3 space-y-4">
              <p className="text-base leading-relaxed text-stone-dark">{NOT_ELIGIBLE_MESSAGE}</p>
              {submitError && <FormError>{submitError}</FormError>}
              {ownReview && (
                <Button variant="ghost" onClick={handleDelete}>
                  Delete your review
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
              {ownReview?.status === "APPROVED" && (
                <p className="text-sm leading-relaxed text-stone-dark">
                  Editing your review sends it for a quick check again before it reappears.
                </p>
              )}
              {submitError && <FormError>{submitError}</FormError>}
              <fieldset>
                <legend className="mb-1 block text-sm text-charcoal">Your rating</legend>
                <StarPicker value={rating} onChange={setRating} />
              </fieldset>
              <Field label="Title" optional>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={TITLE_MAX}
                  placeholder="Loved the colours"
                />
              </Field>
              <Field label="Your review" error={bodyError} hint={`${BODY_MIN} to ${BODY_MAX} characters`}>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={BODY_MAX}
                  rows={4}
                  placeholder="Share what you liked"
                />
              </Field>
              <div className="flex flex-wrap items-center gap-6">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving…" : ownReview ? "Update review" : "Submit review"}
                </Button>
                {ownReview && (
                  <Button variant="ghost" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

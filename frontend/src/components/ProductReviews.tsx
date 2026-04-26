"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ApiError, ApiReview, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const Star: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 16 }) => (
  <svg
    className={filled ? "text-amber-400" : "text-amber-200"}
    style={{ width: size, height: size }}
    viewBox="0 0 20 20"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    aria-hidden
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.963 9.386c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
  </svg>
);

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} filled={i < Math.round(value)} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            aria-label={`${v} star${v === 1 ? "" : "s"}`}
            className="p-1 -m-1"
          >
            <Star filled={v <= value} size={22} />
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

interface Props {
  productId: number;
  onStatsChange?: (stats: { averageRating: number; reviewCount: number }) => void;
}

export default function ProductReviews({ productId, onStatsChange }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<ApiReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listProductReviews(productId, { take: 20 });
      setItems(res.items);
      setAverageRating(res.averageRating ?? 0);
      setTotal(res.total);
      onStatsChange?.({ averageRating: res.averageRating ?? 0, reviewCount: res.total });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId, onStatsChange]);

  useEffect(() => {
    load();
  }, [load]);

  const myReview = user ? items.find((r) => r.userId === user.id) : null;

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setTitle(myReview.title ?? "");
      setBody(myReview.body);
    }
  }, [myReview?.id, myReview?.rating, myReview?.title, myReview?.body]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!body.trim()) {
      setSubmitError("Please write a short review.");
      return;
    }
    setSubmitting(true);
    try {
      await api.upsertProductReview(productId, {
        rating,
        title: title.trim() || null,
        body: body.trim(),
      });
      await load();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!confirm("Delete your review?")) return;
    try {
      await api.deleteReview(myReview.id);
      setTitle("");
      setBody("");
      setRating(5);
      await load();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to delete review");
    }
  };

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="pill mb-3">Customer reviews</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            What people are saying
          </h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-700">
            <StarRow value={averageRating} />
            <span>
              {averageRating > 0 ? averageRating.toFixed(1) : "—"} · {total} review{total === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-sm text-slate-500">Loading reviews…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-slate-600">
              No reviews yet — be the first to share your thoughts.
            </div>
          ) : (
            items.map((r) => (
              <article
                key={r.id}
                className="section-card p-4 bg-white/90 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-900">
                    {r.user?.name?.trim() || "Anonymous"}
                  </div>
                  <div className="text-xs text-slate-500">{formatDate(r.createdAt)}</div>
                </div>
                <StarRow value={r.rating} />
                {r.title && (
                  <div className="font-semibold text-slate-900">{r.title}</div>
                )}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {r.body}
                </p>
              </article>
            ))
          )}
        </div>

        <div>
          <div className="section-card p-4 bg-white/90">
            <h3 className="font-semibold text-slate-900 mb-3">
              {myReview ? "Edit your review" : "Write a review"}
            </h3>
            {!user ? (
              <p className="text-sm text-slate-600">
                Sign in to share your experience with this product.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase tracking-[0.16em] text-olive-green/70 mb-1">
                    Your rating
                  </label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.16em] text-olive-green/70 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    className="w-full border border-olive-green/20 rounded-lg px-3 py-2 text-sm"
                    placeholder="Loved the colours"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.16em] text-olive-green/70 mb-1">
                    Your review
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    className="w-full border border-olive-green/20 rounded-lg px-3 py-2 text-sm"
                    placeholder="Share what you liked"
                    required
                  />
                </div>
                {submitError && (
                  <div className="text-sm text-red-600">{submitError}</div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full bg-olive-green text-white px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : myReview ? "Update review" : "Submit review"}
                  </button>
                  {myReview && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="text-sm text-red-700 underline-offset-4 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

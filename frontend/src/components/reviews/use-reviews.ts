"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ApiReview, type ApiReviewEligibility } from "@/lib/api";
import { bodyProblem, classifySubmitError, errorText, thanksFor } from "./review-logic";

type Stats = { averageRating: number; reviewCount: number };

/** The public review list, the caller's own review and the aggregate rating. */
export function useReviewList(productId: number, userId: number | null, onStatsChange?: (stats: Stats) => void) {
  const [items, setItems] = useState<ApiReview[]>([]);
  const [ownReview, setOwnReview] = useState<ApiReview | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(errorText(err, "Failed to load reviews"));
      } finally {
        setLoading(false);
      }
    },
    [productId, userId],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { items, ownReview, averageRating, total, loading, error, load };
}

/**
 * Can this person review? Asked of the API so a shopper who cannot is told why, instead of meeting a 403 after
 * typing. If the lookup itself failed, the server still decides on submit.
 */
export function useReviewEligibility(productId: number, userId: number | null) {
  const [eligibility, setEligibility] = useState<ApiReviewEligibility | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setEligibility(null);
    setFailed(false);
    if (userId === null) return;
    let cancelled = false;
    api
      .getReviewEligibility(productId)
      .then((e) => !cancelled && setEligibility(e))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [productId, userId]);
  // The form shows unless we positively know this person cannot review.
  const canWrite = eligibility ? eligibility.canReview : failed;
  const checking = !eligibility && !failed;
  return { canWrite, checking, markIneligible: () => setEligibility({ canReview: false, hasReview: false }) };
}

type FormDeps = {
  productId: number;
  ownReview: ApiReview | null;
  reload: (silent?: boolean) => Promise<void>;
  markIneligible: () => void;
};

/** The write/edit form: field values, validation, submit and delete. */
export function useReviewForm({ productId, ownReview, reload, markIneligible }: FormDeps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [thanks, setThanks] = useState("");

  useEffect(() => {
    if (!ownReview) return;
    setRating(ownReview.rating);
    setTitle(ownReview.title ?? "");
    setBody(ownReview.body);
  }, [ownReview?.id, ownReview?.rating, ownReview?.title, ownReview?.body]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const saved = await api.upsertProductReview(productId, { rating, title: title.trim() || null, body: body.trim() });
    setThanks(thanksFor(saved));
    await reload(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setBodyError(null);
    setThanks("");
    const problem = bodyProblem(body);
    if (problem) return setBodyError(problem);
    setSubmitting(true);
    try {
      await save();
    } catch (err) {
      const failure = classifySubmitError(err);
      // The server disagrees with the eligibility check: explain the rule rather than show a raw error.
      if (failure.kind === "ineligible") markIneligible();
      else setSubmitError(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ownReview || !confirm("Delete your review?")) return;
    try {
      await api.deleteReview(ownReview.id);
      setTitle("");
      setBody("");
      setRating(5);
      setThanks("");
      await reload(true);
    } catch (err) {
      setSubmitError(errorText(err, "Failed to delete review"));
    }
  };

  return {
    values: { rating, title, body },
    setRating,
    setTitle,
    setBody,
    submitting,
    bodyError,
    submitError,
    thanks,
    handleSubmit,
    handleDelete,
  };
}

export type ReviewFormState = ReturnType<typeof useReviewForm>;

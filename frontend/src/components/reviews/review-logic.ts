import { ApiError } from "@/lib/api";

export const TITLE_MAX = 100;
export const BODY_MAX = 1000;
export const BODY_MIN = 10;

export const THANKS_MESSAGE = "Thanks — your review will appear after a quick check";
export const UNCHANGED_MESSAGE = "Your review is unchanged.";
export const RATE_LIMIT_MESSAGE = "You've sent a few in a row; please wait a minute.";
export const NOT_ELIGIBLE_MESSAGE = "Reviews are open to customers who have received this product.";

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

/** The inline message for a body that is too short to send, or null when it is long enough. */
export function bodyProblem(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length >= BODY_MIN) return null;
  return trimmed ? `Please write at least ${BODY_MIN} characters.` : "Please write a short review.";
}

/** Only say "a quick check" when the review actually went into the queue; an identical re-submit keeps its status. */
export function thanksFor(saved: { status?: string } | null | undefined): string {
  return saved?.status === "PENDING" ? THANKS_MESSAGE : UNCHANGED_MESSAGE;
}

export type SubmitFailure = { kind: "ineligible" } | { kind: "message"; message: string };

/** Maps a failed submit to what the form should do: explain the eligibility rule, or show a message. */
export function classifySubmitError(err: unknown): SubmitFailure {
  if (err instanceof ApiError && err.status === 403) return { kind: "ineligible" };
  if (err instanceof ApiError && err.status === 429) return { kind: "message", message: RATE_LIMIT_MESSAGE };
  return { kind: "message", message: err instanceof ApiError ? err.message : "Failed to submit review" };
}

export function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

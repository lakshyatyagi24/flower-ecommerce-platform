import { apiFetch, queryString } from './client';
import type { ApiReview, ApiReviewEligibility, ApiReviewList } from './types';

export const reviewsApi = {
  // auth: the token (when there is one) lets the API include the caller's own pending/rejected review.
  listProductReviews: (productId: number, params: { take?: number; skip?: number } = {}) =>
    apiFetch<ApiReviewList>(
      `/products/${productId}/reviews${queryString({ take: params.take, skip: params.skip })}`,
      { auth: true },
    ),
  getReviewEligibility: (productId: number) =>
    apiFetch<ApiReviewEligibility>(`/products/${productId}/reviews/eligibility`, { auth: true }),
  upsertProductReview: (productId: number, body: { rating: number; title?: string | null; body: string }) =>
    apiFetch<ApiReview>(`/products/${productId}/reviews`, { method: 'POST', body, auth: true }),
  deleteReview: (reviewId: number) =>
    apiFetch<{ success: true }>(`/reviews/${reviewId}`, { method: 'DELETE', auth: true }),
};

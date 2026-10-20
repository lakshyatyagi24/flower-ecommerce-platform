import { apiFetch, queryString } from './http';
import { downloadCsv } from './files';
import type {
  AdminCustomer,
  AdminEnquiry,
  AdminEnquiryStatus,
  AdminOrder,
  AdminOrderFilters,
  AdminOrderPatch,
  AdminReview,
  AdminReviewStatus,
  AdminStats,
  AdminSubscriber,
  CsvDownload,
} from './types';

function orderFilterParams(params: AdminOrderFilters): URLSearchParams {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  if (params.paymentMethod) qs.set('paymentMethod', params.paymentMethod);
  if (params.attention) qs.set('attention', params.attention);
  if (params.sort) qs.set('sort', params.sort);
  if (params.q && params.q.trim()) qs.set('q', params.q.trim());
  return qs;
}

export const ordersApi = {
  listOrders: (params: AdminOrderFilters & { take?: number; skip?: number } = {}) => {
    const qs = orderFilterParams(params);
    if (params.take !== undefined) qs.set('take', String(params.take));
    if (params.skip !== undefined) qs.set('skip', String(params.skip));
    const suffix = qs.toString();
    return apiFetch<{ items: AdminOrder[]; total: number }>(`/orders${suffix ? `?${suffix}` : ''}`);
  },
  getOrder: (id: number) => apiFetch<AdminOrder>(`/orders/${id}`),
  updateOrderStatus: (id: number, status: string) =>
    apiFetch<AdminOrder>(`/orders/${id}/status`, { method: 'PUT', body: { status } }),
  updateOrder: (id: number, patch: AdminOrderPatch) =>
    apiFetch<AdminOrder>(`/orders/${id}`, { method: 'PUT', body: patch }),
  stats: (range: { from?: string; to?: string } = {}) =>
    apiFetch<AdminStats>(`/orders/stats${queryString({ from: range.from || undefined, to: range.to || undefined })}`),
};

export const enquiriesApi = {
  listEnquiries: (params: { status?: string; take?: number; skip?: number } = {}) =>
    apiFetch<{ items: AdminEnquiry[]; total: number; take: number; skip: number; openCount: number }>(
      `/enquiries${queryString({ status: params.status || undefined, take: params.take, skip: params.skip })}`,
    ),
  getEnquiry: (id: number) => apiFetch<AdminEnquiry>(`/enquiries/${id}`),
  updateEnquiryStatus: (id: number, status: string, adminNotes?: string) =>
    apiFetch<AdminEnquiry>(`/enquiries/${id}/status`, {
      method: 'PUT',
      body: { status, adminNotes },
    }),
  enquiryStats: () =>
    apiFetch<{
      byStatus: Record<AdminEnquiryStatus, number>;
      open: number;
      total: number;
    }>('/enquiries/stats'),
};

export const peopleApi = {
  listCustomers: () => apiFetch<AdminCustomer[]>('/users/customers'),
  listSubscribers: (take = 50, skip = 0) =>
    apiFetch<{ items: AdminSubscriber[]; total: number }>(`/newsletter?take=${take}&skip=${skip}`),
};

export const reviewsApi = {
  listReviews: (params: { productId?: number; status?: AdminReviewStatus; take?: number; skip?: number } = {}) =>
    apiFetch<{
      items: AdminReview[];
      total: number;
      take: number;
      skip: number;
      counts: Record<AdminReviewStatus, number>;
    }>(
      `/reviews${queryString({
        productId: params.productId,
        status: params.status,
        take: params.take,
        skip: params.skip,
      })}`,
    ),
  setReviewStatus: (id: number, status: AdminReviewStatus) =>
    apiFetch<AdminReview>(`/reviews/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteReview: (id: number) => apiFetch<{ success: true }>(`/reviews/${id}`, { method: 'DELETE' }),
};

export async function downloadSubscribersCsv(): Promise<void> {
  await downloadCsv('/newsletter/export.csv', 'subscribers.csv');
}

/** Orders CSV for the SAME filters as the list (search, status, payment, attention, upcoming). */
export function downloadOrdersCsv(filters: AdminOrderFilters): Promise<CsvDownload> {
  const qs = orderFilterParams(filters).toString();
  return downloadCsv(`/orders/export.csv${qs ? `?${qs}` : ''}`, 'orders.csv');
}

import { apiFetch } from './client';
import type { ApiEnquiry } from './types';

type CreateEnquiryBody = {
  productId?: number | null;
  productName?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  quantity?: number;
  eventDate?: string;
  occasion?: string;
  budget?: number;
  address?: string;
  city?: string;
  message?: string;
  source?: string;
};

export const miscApi = {
  // Enquiries (public POST)
  createEnquiry: (body: CreateEnquiryBody) => apiFetch<ApiEnquiry>('/enquiries', { method: 'POST', body }),
  subscribeNewsletter: (email: string) =>
    apiFetch<{ ok: true }>('/newsletter', { method: 'POST', body: { email, source: 'footer' } }),
  getSettings: () => apiFetch<Record<string, string>>('/settings'),
};

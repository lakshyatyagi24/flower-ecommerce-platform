// Centralized API client for the admin panel. Implementation lives in ./api-modules; this file
// re-exports everything so `@/lib/api` import paths stay valid.
import { apiFetch } from './api-modules/http';
import { uploadImage } from './api-modules/files';
import { categoriesApi, couponsApi, productsApi, slidersApi } from './api-modules/resources-catalog';
import { enquiriesApi, ordersApi, peopleApi, reviewsApi } from './api-modules/resources-sales';
import type { AdminUser } from './api-modules/types';

export { API_BASE, getStoredToken, setStoredToken, notifyUnauthorized } from './api-modules/token';
export { ApiError, apiFetch, extractErrorMessage } from './api-modules/http';
export { IMAGE_UPLOAD_MAX_BYTES, IMAGE_UPLOAD_TYPES, validateImageFile, uploadImage } from './api-modules/files';
export { downloadOrdersCsv, downloadSubscribersCsv } from './api-modules/resources-sales';
export type * from './api-modules/types';

const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),
  me: () => apiFetch<AdminUser>('/auth/me'),
  forgotPassword: (email: string) =>
    apiFetch<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ ok: true }>('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
};

const settingsApi = {
  getAdminSettings: () => apiFetch<Record<string, string>>('/settings/admin'),
  updateSettings: (values: Record<string, string>) =>
    apiFetch<Record<string, string>>('/settings', { method: 'PUT', body: values }),
};

export const adminApi = {
  ...authApi,
  ...productsApi,
  ...ordersApi,
  ...enquiriesApi,
  ...peopleApi,
  ...couponsApi,
  ...categoriesApi,
  ...reviewsApi,
  ...slidersApi,
  uploadImage,
  ...settingsApi,
};

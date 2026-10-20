import { apiFetch } from './client';
import type { AuthResponse, AuthUser } from './types';

export const authApi = {
  register: (body: { email: string; password: string; name?: string; phone?: string }) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body }),
  me: () => apiFetch<AuthUser>('/auth/me', { auth: true }),
  forgotPassword: (email: string) =>
    apiFetch<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ ok: true }>('/auth/reset-password', { method: 'POST', body: { token, password } }),
};

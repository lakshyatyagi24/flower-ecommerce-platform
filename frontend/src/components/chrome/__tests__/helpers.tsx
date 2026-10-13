import { vi } from 'vitest';

export const push = vi.fn();
export const nav = { pathname: '/' };
export const auth: { user: null | { name?: string; email: string }; loading: boolean; logout: () => void } = {
  user: null,
  loading: false,
  logout: vi.fn(),
};
export const cart = {
  items: [] as any[],
  count: 0,
  subtotal: 0,
  gstTotal: 0,
  isOpen: false,
  open: vi.fn(),
  close: vi.fn(),
  setQuantity: vi.fn(),
  remove: vi.fn(),
  replaceWith: vi.fn(),
};
export const listCategories = vi.fn();
export const settingsRaw: Record<string, string> = {};

export function resetChromeMocks() {
  push.mockReset();
  nav.pathname = '/';
  auth.user = null;
  auth.loading = false;
  auth.logout = vi.fn();
  cart.items = [];
  cart.count = 0;
  cart.subtotal = 0;
  cart.gstTotal = 0;
  cart.isOpen = false;
  cart.open = vi.fn();
  cart.close = vi.fn();
  cart.setQuantity = vi.fn();
  cart.remove = vi.fn();
  cart.replaceWith = vi.fn();
  listCategories.mockReset();
  for (const k of Object.keys(settingsRaw)) delete settingsRaw[k];
}

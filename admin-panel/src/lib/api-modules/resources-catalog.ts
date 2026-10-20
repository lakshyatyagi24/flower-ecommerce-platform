import { apiFetch, queryString } from './http';
import type {
  AdminCategory,
  AdminCategoryInput,
  AdminCoupon,
  AdminCouponInput,
  AdminProduct,
  AdminSlider,
  AdminSliderInput,
} from './types';

export const productsApi = {
  // Uses the admin endpoint so inactive/soft-disabled products are visible
  // (the public /products endpoint only ever returns active ones).
  listProducts: (params: { active?: boolean | 'all'; take?: number; skip?: number } = {}) => {
    const qs = queryString({
      active: params.active === true || params.active === false ? String(params.active) : 'all',
      take: params.take,
      skip: params.skip,
    });
    return apiFetch<{ items: AdminProduct[]; total: number }>(`/products/admin${qs}`);
  },
  createProduct: (body: Partial<AdminProduct> & { name: string; price: number }) =>
    apiFetch<AdminProduct>('/products', { method: 'POST', body }),
  updateProduct: (id: number, body: Partial<AdminProduct>) =>
    apiFetch<AdminProduct>(`/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id: number) =>
    apiFetch<{ success: true } | AdminProduct>(`/products/${id}`, { method: 'DELETE' }),
};

export const couponsApi = {
  listCoupons: () => apiFetch<AdminCoupon[]>('/coupons'),
  createCoupon: (body: AdminCouponInput) => apiFetch<AdminCoupon>('/coupons', { method: 'POST', body }),
  updateCoupon: (id: number, body: Partial<Omit<AdminCouponInput, 'code'>>) =>
    apiFetch<AdminCoupon>(`/coupons/${id}`, { method: 'PUT', body }),
  deleteCoupon: (id: number) => apiFetch<{ deleted: true }>(`/coupons/${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  listCategories: () => apiFetch<AdminCategory[]>('/categories/all'),
  listCategoriesPublic: () => apiFetch<AdminCategory[]>('/categories'),
  createCategory: (body: AdminCategoryInput) =>
    apiFetch<AdminCategory>('/categories', { method: 'POST', body }),
  updateCategory: (id: number, body: Partial<AdminCategoryInput>) =>
    apiFetch<AdminCategory>(`/categories/${id}`, { method: 'PUT', body }),
  deleteCategory: (id: number) =>
    apiFetch<{ success: true } | AdminCategory>(`/categories/${id}`, { method: 'DELETE' }),
};

export const slidersApi = {
  // The list is public; includeInactive only takes effect with the admin bearer token.
  listSliders: (includeInactive: boolean) =>
    apiFetch<AdminSlider[]>(`/sliders?includeInactive=${includeInactive}`),
  createSlider: (body: AdminSliderInput) => apiFetch<AdminSlider>('/sliders', { method: 'POST', body }),
  updateSlider: (id: number, body: AdminSliderInput) =>
    apiFetch<AdminSlider>(`/sliders/${id}`, { method: 'PUT', body }),
  deleteSlider: (id: number) => apiFetch<unknown>(`/sliders/${id}`, { method: 'DELETE' }),
};

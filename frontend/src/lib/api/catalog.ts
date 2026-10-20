import { apiFetch, queryString } from './client';
import type { ApiCategory, ApiProduct, ApiProductList, ProductSort } from './types';

type ListProductsParams = {
  category?: string;
  tag?: string;
  sort?: ProductSort;
  q?: string;
  featured?: boolean;
  page?: number;
  take?: number;
};

export const catalogApi = {
  listCategories: () => apiFetch<ApiCategory[]>('/categories'),
  listProducts: (params: ListProductsParams = {}) =>
    apiFetch<ApiProductList>(
      `/products${queryString({
        category: params.category,
        tag: params.tag,
        sort: params.sort,
        q: params.q,
        featured: params.featured,
        page: params.page,
        take: params.take,
      })}`,
    ),
  getProductBySlug: (slug: string) => apiFetch<ApiProduct>(`/products/slug/${encodeURIComponent(slug)}`),
};

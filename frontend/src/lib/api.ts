export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
};

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  image?: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  categoryId?: number | null;
  category?: ApiCategory | null;
  averageRating?: number;
  reviewCount?: number;
};

type ListProductsResponse = {
  items: ApiProduct[];
  total: number;
  take: number;
  skip: number;
};

type ListProductsParams = {
  category?: string;
  q?: string;
  featured?: boolean;
  active?: boolean;
  take?: number;
  skip?: number;
};

const DEFAULT_API_BASE = "https://api.freshpetalsindia.com";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function sanitizeBaseUrl(value: string): string {
  return value.trim().replace(/\/$/, "");
}

export function resolveApiBase(): string {
  const envBase =
    typeof process !== "undefined" &&
    process.env &&
    typeof process.env.NEXT_PUBLIC_API_BASE === "string"
      ? process.env.NEXT_PUBLIC_API_BASE
      : "";

  if (envBase.trim()) {
    return sanitizeBaseUrl(envBase);
  }

  if (isBrowser() && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }

  return DEFAULT_API_BASE;
}

export function sanitizeImageUrl(input?: string | null): string | undefined {
  if (!input) return undefined;
  let value = String(input).trim();
  if (!value) return undefined;

  // Handle escaped URL values from serialized JSON.
  value = value.replace(/\\\//g, "/");

  // Attempt decode for partially encoded values.
  for (let i = 0; i < 2; i += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(value)) break;
    try {
      value = decodeURIComponent(value);
    } catch {
      break;
    }
  }

  // Fix malformed protocols like https:://cdn.shopify.com.
  value = value
    .replace(/^https::\/\//i, "https://")
    .replace(/^http::\/\//i, "http://")
    .replace(/^https:\/([^/])/i, "https://$1")
    .replace(/^http:\/([^/])/i, "http://$1");

  if (value.startsWith("//")) {
    value = `https:${value}`;
  }

  if (/^cdn\.shopify\.com\//i.test(value)) {
    value = `https://${value}`;
  }

  if (/^http:\/\/cdn\.shopify\.com/i.test(value)) {
    value = value.replace(/^http:\/\//i, "https://");
  }

  if (!/^https?:\/\//i.test(value)) {
    return undefined;
  }

  return value;
}

function normalizeCategory(category?: ApiCategory | null): ApiCategory | undefined {
  if (!category) return undefined;
  return {
    ...category,
    image: sanitizeImageUrl(category.image ?? undefined) ?? category.image,
  };
}

function normalizeProduct(product: ApiProduct): ApiProduct {
  return {
    ...product,
    image: sanitizeImageUrl(product.image ?? undefined) ?? product.image,
    category: normalizeCategory(product.category) ?? product.category,
  };
}

async function requestJson<T>(path: string): Promise<T> {
  const base = resolveApiBase();
  const url = `${base}${path}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const api = {
  async listProducts(params: ListProductsParams = {}): Promise<ListProductsResponse> {
    const query = toQuery({
      category: params.category,
      q: params.q,
      featured: params.featured,
      active: params.active,
      take: params.take,
      skip: params.skip,
    });
    const result = await requestJson<ListProductsResponse>(`/products${query}`);
    return {
      ...result,
      items: Array.isArray(result.items) ? result.items.map(normalizeProduct) : [],
    };
  },

  async getProductBySlug(slug: string): Promise<ApiProduct> {
    const safeSlug = encodeURIComponent(slug);
    const product = await requestJson<ApiProduct>(`/products/slug/${safeSlug}`);
    return normalizeProduct(product);
  },

  async listCategories(): Promise<ApiCategory[]> {
    const categories = await requestJson<ApiCategory[]>("/categories");
    return Array.isArray(categories)
      ? categories.map((c) => ({ ...c, image: sanitizeImageUrl(c.image ?? undefined) ?? c.image }))
      : [];
  },

  async listSliders(): Promise<any[]> {
    const sliders = await requestJson<any[]>("/sliders");
    return Array.isArray(sliders)
      ? sliders.map((s) => ({ ...s, image: sanitizeImageUrl(s.image) ?? s.image }))
      : [];
  },
};

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

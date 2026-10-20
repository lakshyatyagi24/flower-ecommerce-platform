import type { AdminProduct, AdminProductType, AdminSaleMode } from "@/lib/api";
import { isAllowedImageUrl } from "@/lib/image-url";

export interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  image: string;
  stock: string;
  categoryId: string;
  featured: boolean;
  active: boolean;
  productType: AdminProductType;
  saleMode: AdminSaleMode;
  gstRate: string;
  unit: string;
  minOrderQty: string;
  tags: string;
}

export const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  image: "",
  stock: "0",
  categoryId: "",
  featured: false,
  active: true,
  productType: "CUT_FLOWER",
  saleMode: "PURCHASE",
  gstRate: "0",
  unit: "piece",
  minOrderQty: "1",
  tags: "",
};

export const TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const TAG_MAX_LEN = 40;
const TAG_MAX_COUNT = 20;

export function isValidTag(tag: string): boolean {
  return tag.length <= TAG_MAX_LEN && TAG_RE.test(tag);
}

// Mirrors the backend rule: trim, lowercase, de-duplicate; each tag a lowercase slug (max 40), max 20 tags.
export function parseTags(text: string): { tags: string[]; error: string | null } {
  const tags: string[] = [];
  for (const part of text.split(",")) {
    const t = part.trim().toLowerCase();
    if (t && !tags.includes(t)) tags.push(t);
  }
  const bad = tags.filter((t) => !isValidTag(t));
  if (bad.length) return { tags, error: `Tags must be lowercase letters, numbers and hyphens (max ${TAG_MAX_LEN} chars): ${bad.join(", ")}` };
  if (tags.length > TAG_MAX_COUNT) return { tags, error: `At most ${TAG_MAX_COUNT} tags per product (${tags.length} entered)` };
  return { tags, error: null };
}

export function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Legacy sliders/products stored the picture inline as a data: URL; those are kept as-is. */
export function isLegacyInlineImage(image: string): boolean {
  return image.startsWith("data:");
}

export function isImageInvalid(image: string): boolean {
  return !isLegacyInlineImage(image) && !isAllowedImageUrl(image);
}

export function productToForm(p: AdminProduct): ProductForm {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    price: p.price.toString(),
    image: p.image ?? "",
    stock: p.stock.toString(),
    categoryId: p.categoryId?.toString() ?? "",
    featured: p.featured,
    active: p.active,
    productType: p.productType ?? "CUT_FLOWER",
    saleMode: p.saleMode ?? "PURCHASE",
    gstRate: (p.gstRate ?? 0).toString(),
    unit: p.unit ?? "piece",
    minOrderQty: (p.minOrderQty ?? 1).toString(),
    tags: (p.tags ?? []).join(", "),
  };
}

function parsePrice(form: ProductForm): number {
  const priceNum = parseFloat(form.price);
  if (form.saleMode !== "ENQUIRY" && (isNaN(priceNum) || priceNum < 0)) {
    throw new Error("Please enter a valid price for purchase products.");
  }
  return isNaN(priceNum) ? 0 : priceNum;
}

function parseGstRate(form: ProductForm): number {
  const gstNum = parseFloat(form.gstRate || "0");
  if (isNaN(gstNum) || gstNum < 0) {
    throw new Error("Please enter a valid GST rate (0 or positive).");
  }
  return gstNum;
}

function parseTagsOrThrow(text: string): string[] {
  const parsed = parseTags(text);
  if (parsed.error) throw new Error(parsed.error);
  return parsed.tags;
}

function parseStock(raw: string): number {
  const n = parseInt(raw || "0", 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function parseMinOrderQty(raw: string): number {
  const n = parseInt(raw || "1", 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

/** Validates the form and builds the API payload. Throws an Error with a user-facing message. */
export function buildProductPayload(form: ProductForm) {
  const price = parsePrice(form);
  const gstRate = parseGstRate(form);
  const tags = parseTagsOrThrow(form.tags);
  return {
    name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    description: form.description.trim() || undefined,
    price,
    // Never send legacy base64 data: URLs (they exceed the DTO limit); omit unless replaced by an upload/URL.
    image: form.image && !isLegacyInlineImage(form.image) ? form.image : undefined,
    stock: parseStock(form.stock),
    featured: form.featured,
    active: form.active,
    categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
    productType: form.productType,
    saleMode: form.saleMode,
    gstRate,
    unit: form.unit,
    minOrderQty: parseMinOrderQty(form.minOrderQty),
    tags,
  };
}

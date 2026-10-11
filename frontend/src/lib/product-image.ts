export const PLACEHOLDER_IMAGE = '/images/placeholder-bloom.jpg';

// Only Cloudinary (https) and same-origin paths are allowed by next.config.mjs.
// Anything else (Shopify URLs, data: URIs, http://, protocol-relative) falls
// back to the local placeholder so next/image never throws.
export function productImage(p: { image?: string | null } | null | undefined): string {
  return safeImage(p?.image);
}

export function safeImage(src: string | null | undefined): string {
  const img = src?.trim();
  if (!img) return PLACEHOLDER_IMAGE;
  if (img.startsWith('https://res.cloudinary.com/')) return img;
  if (img.startsWith('/') && !img.startsWith('//') && !img.startsWith('/\\')) return img;
  return PLACEHOLDER_IMAGE;
}

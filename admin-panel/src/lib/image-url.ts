// Mirrors the backend DTO rule and the storefront's safeImage(): only Cloudinary
// https URLs or site-relative paths are rendered. Empty means "no image".
const ALLOWED_IMAGE_URL = /^(https:\/\/res\.cloudinary\.com\/|\/(?!\/))/;

export const IMAGE_URL_ERROR =
  "Use the Upload button, or a Cloudinary/site-relative URL — other hosts won't display on the storefront.";

export function isAllowedImageUrl(value: string): boolean {
  const v = (value ?? '').trim();
  return v === '' || ALLOWED_IMAGE_URL.test(v);
}

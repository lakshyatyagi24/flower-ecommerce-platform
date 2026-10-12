import type { ApiProduct } from './api';

const hasPhoto = (p: Pick<ApiProduct, 'image'>) => !!p.image && p.image.startsWith('https://res.cloudinary.com/');

/** Stable: products with a real (Cloudinary) photo lead, photo-less ones follow, original order otherwise. */
export function photosFirst<T extends Pick<ApiProduct, 'image'>>(products: T[]): T[] {
  return [...products.filter(hasPhoto), ...products.filter((p) => !hasPhoto(p))];
}

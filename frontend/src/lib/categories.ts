import type { ApiCategory } from './api';

type Node = Pick<ApiCategory, 'active' | 'productCount'> & { children?: Node[] };

/** A category has something to show when it (or a subcategory) holds a product; unknown counts count as yes. */
export function hasProducts(c: Node): boolean {
  return c.productCount === undefined || c.productCount > 0 || (c.children ?? []).some(hasProducts);
}

/**
 * Categories worth linking in navigation: active and not known to be empty. Children are filtered too.
 * An empty collection stays reachable by URL (noindex) but must not be advertised.
 */
export function shownCategories<T extends Node>(list: T[]): T[] {
  return list
    .filter((c) => c.active !== false && hasProducts(c))
    .map((c) => (c.children ? { ...c, children: shownCategories(c.children as T[]) } : c));
}

/** Active categories at every depth, skipping the children of an inactive parent. */
export function flattenActive<T extends Node>(list: T[]): T[] {
  return list.filter((c) => c.active !== false).flatMap((c) => [c, ...flattenActive((c.children ?? []) as T[])]);
}

/** <title> for a collection page, before the layout adds the brand. Purchasable: buy; enquiry-only: enquire. */
export function collectionTitle(c: Pick<ApiCategory, 'name' | 'defaultSaleMode'>, brandSuffixLength = 21): string {
  const full = c.defaultSaleMode === 'ENQUIRY' ? `${c.name} — Enquire Online` : `${c.name} — Buy Fresh Flowers Online`;
  // Keep the full <title> (with the layout's " · Fresh Petals India") within 60 characters; fall back to the bare name.
  return full.length + brandSuffixLength <= 60 ? full : c.name;
}

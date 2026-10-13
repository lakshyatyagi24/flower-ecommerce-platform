import type { ApiProduct, ProductType } from './api';

export type Availability = 'in-stock' | 'out-of-stock' | 'enquiry';

export function minQty(p: { minOrderQty?: number | null }): number {
  return p.minOrderQty && p.minOrderQty > 0 ? p.minOrderQty : 1;
}

/** The single in-stock / out-of-stock / enquiry decision. Stock below the minimum order cannot be bought. */
export function availability(p: Pick<ApiProduct, 'saleMode' | 'stock' | 'minOrderQty'>): Availability {
  if (p.saleMode === 'ENQUIRY') return 'enquiry';
  if (p.stock <= 0 || p.stock < minQty(p)) return 'out-of-stock';
  return 'in-stock';
}

/** "Only N left" is shown up to this many units in stock (and never at zero). Honest, from the API stock. */
export const LOW_STOCK_MAX = 10;

export function isLowStock(p: { stock: number }): boolean {
  return p.stock > 0 && p.stock <= LOW_STOCK_MAX;
}

/** Plural of the product's own unit word ("stem" -> "stems"). Already-plural words are left alone. */
function pluralUnit(unit: string): string {
  if (/s$/.test(unit)) return unit;
  if (/(x|z|ch|sh)$/.test(unit)) return `${unit}es`;
  if (/[^aeiou]y$/.test(unit)) return `${unit.slice(0, -1)}ies`;
  return `${unit}s`;
}

/**
 * "Sold in bunches of 5 stems", or null when there is no minimum. The noun comes only from the product's own
 * `unit` field; a unit that is itself a bunch word, or none, leaves it off.
 */
export function bunchCopy(min: number, unit?: string | null): string | null {
  if (!(min > 1)) return null;
  const u = (unit ?? '').trim().toLowerCase();
  const noun = !u || /^(bunch|bunches|bundle|bundles)$/.test(u) ? '' : ` ${pluralUnit(u)}`;
  return `Sold in bunches of ${min}${noun}`;
}

export type CartItemInput = Pick<
  ApiProduct,
  'id' | 'slug' | 'name' | 'price' | 'image' | 'stock' | 'saleMode' | 'gstRate' | 'minOrderQty'
> & { unit?: string };

/** The one place the cart-item shape is built from a product. */
export function toCartItem(p: CartItemInput) {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.image,
    saleMode: p.saleMode,
    gstRate: p.gstRate,
    minOrderQty: p.minOrderQty,
    stock: p.stock,
    unit: p.unit,
  };
}

export function careCopy(type: ProductType | undefined): string[] {
  switch (type) {
    case 'CUT_FLOWER':
    case 'BOUQUET':
      return [
        'Trim the stems at an angle and place them in clean, cool water as soon as they arrive.',
        'Change the water every two days and keep the stems away from direct sun, heat and ripening fruit.',
      ];
    case 'PLANT':
      return [
        'Place in bright, indirect light and avoid harsh afternoon sun.',
        'Water when the top of the soil feels dry; do not leave the pot standing in water.',
      ];
    case 'ARRANGEMENT':
      return [
        'Keep the arrangement in a cool spot away from direct sun and heat.',
        'Top up the water or foam moisture every day or two.',
      ];
    default:
      return ['Keep away from direct sun and heat. Follow any care card included with your order.'];
  }
}

export type Usp = { title: string; body: string };

/** Reassurance points come from the admin-managed `trust.uspN*` settings; the fallback makes no delivery promise. */
export function uspsFromSettings(settings: Record<string, string>, max = 3): Usp[] {
  const out: Usp[] = [];
  for (let i = 1; i <= 4 && out.length < max; i++) {
    const title = settings[`trust.usp${i}Title`]?.trim();
    const body = settings[`trust.usp${i}Body`]?.trim() ?? '';
    if (title) out.push({ title, body });
  }
  return out.length > 0 ? out : [{ title: 'Chosen with care', body: '' }];
}

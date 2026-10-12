import { ImageResponse } from 'next/og';
import { BrandCard, OG_FONT_FAMILY, ProductCard } from '@/lib/og-cards';
import { OG_CONTENT_TYPE, OG_SIZE, clampProductName, ogPhotoUrl, ogPrice } from '@/lib/og';
import { ogFont } from '@/lib/og-font';
import { getProduct } from '@/lib/server-api';
import type { ApiProduct } from '@/lib/api';
import type { ReactElement } from 'react';

// R1: calls the API, so never evaluated at build time.
export const dynamic = 'force-dynamic';
export const alt = 'Fresh Petals India product';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const CACHE_CARD = 'public, max-age=86400, stale-while-revalidate=604800';
const CACHE_FALLBACK = 'public, max-age=300';

async function render(el: ReactElement, cache: string): Promise<Response> {
  const font = { name: OG_FONT_FAMILY, data: await ogFont(), weight: 500 as const, style: 'normal' as const };
  // Render fully into a buffer so a failure can never produce a truncated 200 stream.
  const buf = await new ImageResponse(el, { ...OG_SIZE, fonts: [font] }).arrayBuffer();
  return new Response(buf, { headers: { 'Content-Type': OG_CONTENT_TYPE, 'Cache-Control': cache } });
}

async function renderSafely(el: ReactElement, cache: string): Promise<Response> {
  try {
    return await render(el, cache);
  } catch {
    try {
      return await render(<BrandCard />, CACHE_FALLBACK);
    } catch {
      return new Response('Image generation failed', { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
  }
}

export default async function Image({ params }: { params: { slug: string } }): Promise<Response> {
  let product: ApiProduct | null = null;
  try {
    product = await getProduct(params.slug);
  } catch {
    product = null; // API down: degrade to the brand card rather than a broken image
  }
  if (!product || product.active === false) {
    return renderSafely(<BrandCard />, CACHE_FALLBACK);
  }
  // Real photo: let Cloudinary serve a small 1200x630 JPEG (a PNG card with a photo is too heavy for WhatsApp).
  const photo = ogPhotoUrl(product.image);
  if (photo) {
    return new Response(null, { status: 307, headers: { Location: photo, 'Cache-Control': CACHE_CARD } });
  }
  return renderSafely(<ProductCard name={clampProductName(product.name)} price={ogPrice(product)} />, CACHE_CARD);
}

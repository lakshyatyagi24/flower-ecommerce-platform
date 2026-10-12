import { ImageResponse } from 'next/og';
import { BrandCard, OG_FONT_FAMILY, ProductCard } from '@/lib/og-cards';
import { ogFont } from '@/lib/og-font';
import { OG_CONTENT_TYPE, OG_SIZE, clampProductName, fetchOgPhoto, ogPrice } from '@/lib/og';
import { getProduct } from '@/lib/server-api';
import type { ApiProduct } from '@/lib/api';

// R1: calls the API, so never evaluated at build time.
export const dynamic = 'force-dynamic';
export const alt = 'Fresh Petals India product';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;


export default async function Image({ params }: { params: { slug: string } }) {
  let product: ApiProduct | null = null;
  try {
    product = await getProduct(params.slug);
  } catch {
    product = null; // API down: degrade to the brand card rather than a broken image
  }
  const font = { name: OG_FONT_FAMILY, data: await ogFont(), weight: 500 as const, style: 'normal' as const };
  if (!product || product.active === false) {
    return new ImageResponse(<BrandCard />, { ...size, fonts: [font] });
  }
  const photo = await fetchOgPhoto(product.image);
  return new ImageResponse(
    <ProductCard name={clampProductName(product.name)} price={ogPrice(product)} photo={photo} />,
    { ...size, fonts: [font] },
  );
}

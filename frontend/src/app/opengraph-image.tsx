import { ImageResponse } from 'next/og';
import { BrandCard, OG_FONT_FAMILY } from '@/lib/og-cards';
import { ogFont } from '@/lib/og-font';
import { OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og';

export const alt = 'Fresh Petals India: farm-fresh flowers, delivered';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// The font ships in the repo (SIL OFL); nothing is fetched from the internet at runtime.
// This route has no dynamic input, so Next renders it once at build time.


export default async function Image() {
  return new ImageResponse(<BrandCard />, {
    ...size,
    fonts: [{ name: OG_FONT_FAMILY, data: await ogFont(), weight: 500, style: 'normal' }],
  });
}

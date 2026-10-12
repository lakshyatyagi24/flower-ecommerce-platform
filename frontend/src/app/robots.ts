import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

// Private / utility areas stay out of the index. /track-order includes its results page;
// /search is a utility redirect; /api never serves pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/checkout', '/account', '/track-order', '/search', '/design-preview', '/api'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}

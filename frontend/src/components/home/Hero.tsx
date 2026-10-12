import Image from 'next/image';
import Button from '@/components/ui/Button';
import Eyebrow from '@/components/ui/Eyebrow';
import { HERO_IMAGE_SIZE, type HeroContent } from '@/lib/hero';

/**
 * Editorial split hero: text on ivory beside a tall image (image first on mobile). Server component that
 * receives already-validated content, so it renders without the API (see lib/hero.ts for the fallback).
 * This is the only <h1> on the home page.
 */
export default function Hero({ hero }: { hero: HeroContent }) {
  return (
    <section aria-labelledby="home-hero-title" className="border-b border-stone-light">
      <div className="grid w-full md:grid-cols-2">
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-ivory-deep md:order-2 md:aspect-auto md:h-[min(calc(100vh-150px),760px)] md:min-h-[520px]">
          <Image
            src={hero.image}
            alt={hero.alt}
            width={HERO_IMAGE_SIZE.width}
            height={HERO_IMAGE_SIZE.height}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover"
          />
        </div>
        {/* lg: the text column starts at the same x as Container content (max 1280, px-8) so the h1 shares a left edge with section headings. */}
        <div className="flex items-center px-5 py-12 md:order-1 md:py-16 md:pl-8 md:pr-12 lg:pl-[max(2rem,calc((100vw-1280px)/2+2rem))] lg:pr-16">
          <div className="max-w-md">
            {hero.eyebrow && <Eyebrow className="mb-5">{hero.eyebrow}</Eyebrow>}
            <h1 id="home-hero-title" className="type-display text-charcoal">
              {hero.title}
            </h1>
            {hero.subtitle && <p className="mt-5 max-w-sm text-base leading-relaxed text-stone-dark">{hero.subtitle}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2">
              <Button href={hero.href} size="lg">
                {hero.ctaLabel}
              </Button>
              {hero.href !== '/products' && (
                <Button href="/products" variant="ghost">
                  Browse all
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

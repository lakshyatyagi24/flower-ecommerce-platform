import Image from 'next/image';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Eyebrow from '@/components/ui/Eyebrow';

/** Editorial split: image left on desktop (above the copy on mobile). */
export default function CorporateSplit() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-ivory-deep md:max-h-[640px]">
            <Image
              src="/images/home-corporate.webp"
              alt="A table centrepiece of cream roses, foliage and pampas grass beside candles"
              width={960}
              height={1200}
              sizes="(min-width: 1280px) 600px, (min-width: 768px) 45vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="max-w-md">
            <Eyebrow className="mb-5">For business</Eyebrow>
            <h2 className="type-h2 text-charcoal">Flowers for work and for gatherings</h2>
            <p className="mt-5 text-base leading-relaxed text-stone-dark">
              Flowers for offices, events and gifting, arranged to your brief and quoted on request.
            </p>
            <div className="mt-8">
              <Button href="/corporate" variant="outline" size="lg">
                Corporate enquiries
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

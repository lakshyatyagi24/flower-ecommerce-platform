import Image from 'next/image';
import { notFound } from 'next/navigation';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Eyebrow from '@/components/ui/Eyebrow';
import Price from '@/components/ui/Price';
import SectionHeading from '@/components/ui/SectionHeading';
import Skeleton from '@/components/ui/Skeleton';

export const metadata = { robots: { index: false, follow: false } };

const swatches = [
  { token: 'ivory', cls: 'bg-ivory' },
  { token: 'ivory-deep', cls: 'bg-ivory-deep' },
  { token: 'charcoal', cls: 'bg-charcoal' },
  { token: 'stone', cls: 'bg-stone' },
  { token: 'stone-dark', cls: 'bg-stone-dark' },
  { token: 'stone-light', cls: 'bg-stone-light' },
  { token: 'moss', cls: 'bg-moss' },
  { token: 'blush', cls: 'bg-blush' },
  { token: 'white', cls: 'bg-white' },
];

function ProductCard({ name, price, unit }: { name: string; price: number; unit?: string }) {
  return (
    <article className="group">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ivory-deep">
        <Image
          src="/images/placeholder-bloom.jpg"
          alt=""
          fill
          sizes="(min-width: 768px) 400px, 100vw"
          className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="mt-4 text-xl text-charcoal">{name}</h3>
      <Price amount={price} unit={unit} className="mt-1 block text-sm" />
    </article>
  );
}

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className="py-16 md:py-24">
      <Container className="space-y-20 md:space-y-28">
        <header>
          <Eyebrow className="mb-3">Design system</Eyebrow>
          <h1 className="type-display text-charcoal">Fresh Petals, in restraint</h1>
          <p className="mt-4 max-w-xl text-stone-dark">Dev-only style guide. Not linked anywhere, not indexed, 404 in production.</p>
        </header>

        <section>
          <SectionHeading eyebrow="Foundation" title="Colour" />
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {swatches.map((s) => (
              <li key={s.token}>
                <div className={`h-24 border border-stone-light ${s.cls}`} />
                <p className="mt-2 text-sm text-charcoal">{s.token}</p>
                <p className="text-xs text-stone-dark">{s.cls}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionHeading eyebrow="Foundation" title="Type scale" />
          <div className="mt-10 space-y-8 border-t border-stone-light pt-8">
            <div><Eyebrow className="mb-2">type-display</Eyebrow><p className="type-display">Hand-tied, delivered fresh</p></div>
            <div><Eyebrow className="mb-2">type-h1</Eyebrow><p className="type-h1">The seasonal edit</p></div>
            <div><Eyebrow className="mb-2">type-h2</Eyebrow><p className="type-h2">Peonies, garden roses and ranunculus</p></div>
            <div><Eyebrow className="mb-2">type-h3</Eyebrow><p className="type-h3">Ivory Garden Bouquet</p></div>
            <div><Eyebrow className="mb-2">type-body</Eyebrow><p className="type-body max-w-xl">Each stem is chosen at the mandi before dawn and arranged by hand, so what reaches you is as fresh as it is considered.</p></div>
            <div><Eyebrow className="mb-2">type-eyebrow</Eyebrow><p className="type-eyebrow">New arrivals</p></div>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Buttons" />
          <div className="mt-10 grid gap-10 border-t border-stone-light pt-8 sm:grid-cols-2">
            {(['md', 'lg'] as const).map((size) => (
              <div key={size} className="space-y-5">
                <Eyebrow>Size {size}</Eyebrow>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size={size}>Add to bag</Button>
                  <Button size={size} variant="outline">View all</Button>
                  <Button size={size} variant="ghost">Read more</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size={size} disabled>Sold out</Button>
                  <Button size={size} variant="outline" disabled>Disabled</Button>
                  <Button size={size} href="/design-preview">As link</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow="Components"
            title="Section heading"
            intro="An eyebrow, a display heading, an optional introduction and an optional link."
            link={{ href: '/design-preview', label: 'Shop all' }}
          />
          <div className="mt-10 flex flex-wrap items-baseline gap-10 border-t border-stone-light pt-8">
            <Price amount={1499} />
            <Price amount={85} unit="/ stem" />
            <Eyebrow>Eyebrow label</Eyebrow>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            <div><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="mt-4 h-5 w-3/4" /><Skeleton className="mt-2 h-4 w-1/3" /></div>
            <div><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="mt-4 h-5 w-2/3" /><Skeleton className="mt-2 h-4 w-1/4" /></div>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Product card" />
          <div className="mt-10 flex flex-wrap items-start gap-10 border-t border-stone-light pt-8">
            <div className="w-[200px]"><ProductCard name="Ivory Garden" price={1499} /></div>
            <div className="w-[320px]"><ProductCard name="Ivory Garden" price={1499} /></div>
            <div className="w-full max-w-[480px]"><ProductCard name="Ivory Garden Bouquet" price={85} unit="/ stem" /></div>
          </div>
        </section>
      </Container>
    </main>
  );
}

import Link from 'next/link';
import Container from '@/components/ui/Container';
import Eyebrow from '@/components/ui/Eyebrow';
import SectionHeading from '@/components/ui/SectionHeading';
import { OCCASIONS } from '@/lib/occasions';

const HOME_SLUGS = ['birthday', 'anniversary', 'wedding', 'just-because'];

/** Four text-led tiles linking to the occasion pages. Static: no API call. */
export default function OccasionTiles() {
  const tiles = HOME_SLUGS.map((s) => OCCASIONS.find((o) => o.slug === s)).filter((o): o is NonNullable<typeof o> => !!o);
  return (
    <section className="border-y border-stone-light py-16 md:py-24">
      <Container>
        <SectionHeading eyebrow="Find the right bunch" title="Shop by occasion" />
        <ul className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:grid-cols-4 md:gap-5">
          {tiles.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/occasions/${o.slug}`}
                className="group flex h-full min-h-[180px] flex-col justify-between border border-stone-light bg-ivory-deep p-5 transition-colors duration-200 hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss md:min-h-[260px] md:p-8"
              >
                <Eyebrow>Flowers for</Eyebrow>
                <span className="mt-8 block">
                  <span className="type-h3 block text-charcoal">{o.name}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal">
                    <span className="underline decoration-stone underline-offset-4 group-hover:decoration-charcoal">Explore</span>
                    <span
                      aria-hidden
                      className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    >
                      &rarr;
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

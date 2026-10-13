import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import PageHeader from "@/components/content/PageHeader";

/**
 * About page. DRAFT editorial copy for owner review (see task-3.7b-report.md): it only states what the
 * previous page already claimed about the business (a family-run Delhi NCR florist working from the
 * wholesale flower market). Sourcing partners, sustainability programmes, delivery promises and statistics
 * were removed because nothing in the codebase backs them.
 */
const offers = [
  {
    title: "Fresh-cut flowers and bouquets",
    body: "Stems and ready bouquets for gifting and for your own vase, available to order online.",
    href: "/products",
    cta: "Shop flowers",
  },
  {
    title: "Arrangements to your brief",
    body: "Custom bouquets, arrangements and hampers are made on enquiry. Tell us the colours, the occasion and the budget.",
    href: "/contact",
    cta: "Send an enquiry",
  },
  {
    title: "Corporate and events",
    body: "Flowers for offices, events and gatherings, planned with you and quoted on request.",
    href: "/corporate",
    cta: "Corporate enquiries",
  },
];

export default function AboutPage() {
  return (
    <main className="py-14 md:py-20">
      <Container>
        <PageHeader eyebrow="About" title="Flowers, arranged by hand in Delhi NCR" />

        <div className="mt-12 grid gap-8 lg:grid-cols-[4fr_7fr] lg:gap-20">
          <h2 className="type-h3 text-charcoal">Our story</h2>
          <div className="max-w-[640px] space-y-5 text-lg leading-[1.75] text-charcoal">
            <p>
              Fresh Petals India is a family-run flower business in Delhi NCR. Our mornings start at the wholesale
              flower market, where we choose roses, lilies, orchids, carnations, sunflowers and seasonal stems by hand.
            </p>
            <p>
              We supply homes, offices and events, and we make custom bouquets and arrangements to order. We would
              rather do a smaller range well than promise everything, and we will always tell you plainly what we can
              and cannot do.
            </p>
          </div>
        </div>

        <section aria-labelledby="what-we-do" className="mt-20 border-t border-stone-light pt-12 md:mt-28">
          <Eyebrow>What we do</Eyebrow>
          <h2 id="what-we-do" className="sr-only">
            What we do
          </h2>
          <ul className="mt-8 grid gap-10 md:grid-cols-3 md:gap-12">
            {offers.map((o) => (
              <li key={o.title} className="flex flex-col items-start">
                <h3 className="type-h3 text-charcoal">{o.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-stone-dark">{o.body}</p>
                <div className="mt-5">
                  <Button href={o.href} variant="ghost">
                    {o.cta}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 border-t border-stone-light pt-12 md:mt-28">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-xl">
              <h2 className="type-h2 text-charcoal">Something in mind?</h2>
              <p className="mt-4 text-base leading-relaxed text-stone-dark">
                Browse the collection, or write to us about an occasion and we will take it from there.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button href="/products" size="lg">
                Shop flowers
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                Contact us
              </Button>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}

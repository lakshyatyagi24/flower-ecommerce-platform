import Link from "next/link";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/content/PageHeader";
import EnquiryForm from "@/components/EnquiryForm";
import { textLink } from "@/components/ui/form-styles";

/** DRAFT editorial copy for owner review (see task-3.7b-report.md). No response-time or delivery promises. */
const offerings = [
  {
    title: "Bulk cut flowers",
    body: "Roses, lilies, orchids, carnations, sunflowers and seasonal stems for offices and venues, subject to availability.",
  },
  {
    title: "Custom bouquets",
    body: "Hand-tied bouquets for gifting, conferences and award ceremonies.",
  },
  {
    title: "Event arrangements",
    body: "Centrepieces, stage florals and reception arrangements for offsites and celebrations.",
  },
  {
    title: "Planned delivery",
    body: "We coordinate delivery details with your event team once the order is confirmed.",
  },
];

const steps = [
  "Send your requirement: quantity, occasion and date.",
  "We reply with a quote and any questions.",
  "Once you approve, we confirm the schedule and prepare your order.",
];

export default function CorporatePage() {
  return (
    <main className="py-14 md:py-20">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[6fr_5fr] lg:gap-20">
          <div>
            <PageHeader
              eyebrow="For business"
              title="Flowers for work and for gatherings"
              intro="Flowers for offices, conferences, hotels and event teams across Delhi NCR, arranged to your brief and quoted on request."
            />

            <ul className="mt-12 grid gap-x-10 gap-y-8 border-t border-stone-light pt-10 sm:grid-cols-2">
              {offerings.map((o) => (
                <li key={o.title}>
                  <h2 className="type-h3 text-charcoal">{o.title}</h2>
                  <p className="mt-2 text-base leading-relaxed text-stone-dark">{o.body}</p>
                </li>
              ))}
            </ul>

            <section aria-labelledby="how-it-works" className="mt-12 border-t border-stone-light pt-10">
              <h2 id="how-it-works" className="type-h3 text-charcoal">
                How it works
              </h2>
              <ol className="mt-6 space-y-4">
                {steps.map((s, i) => (
                  <li key={s} className="grid grid-cols-[2rem_1fr] text-base leading-relaxed text-charcoal">
                    <span className="font-display text-xl text-stone-dark">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </section>

            <p className="mt-12 text-base text-stone-dark">
              Looking for one-off cut flowers instead?{" "}
              <Link href="/collections/cut-flowers" className={`text-charcoal ${textLink}`}>
                Shop the cut-flower catalogue
              </Link>
            </p>
          </div>

          <div className="lg:pt-2">
            <EnquiryForm
              heading="Tell us about your requirement"
              description="Share the details and we will get back to you with a quote."
              source="corporate"
              occasion="Corporate / Office"
              submitLabel="Request a quote"
            />
          </div>
        </div>
      </Container>
    </main>
  );
}

import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/content/PageHeader";
import FaqList from "@/components/content/FaqList";
import PolicySummary from "@/components/content/PolicySummary";
import { textLink } from "@/components/ui/form-styles";
import { categories } from "./faq-data";

export default function FAQPage() {
  return (
    <main className="py-14 md:py-20">
      <Container>
        <PageHeader
          eyebrow="Help"
          title="Frequently asked questions"
          intro={
            <>
              Can&apos;t find your answer? Write to us through the{" "}
              <Link href="/contact" className={textLink}>
                contact page
              </Link>
              .
            </>
          }
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[3fr_8fr] lg:gap-20">
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">On this page</p>
            <ul className="mt-4 space-y-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className={`inline-flex min-h-11 items-center text-base text-charcoal ${textLink}`}>
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="max-w-[760px] space-y-16">
            {categories.map((c) => (
              <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-28">
                <h2 id={`${c.id}-title`} className="type-h2 mb-6 text-charcoal">
                  {c.title}
                </h2>
                {c.id === "delivery" && <PolicySummary kind="delivery" title="From the shop" className="mb-8" />}
                {c.id === "payments" && <PolicySummary kind="returns" title="From the shop" className="mb-8" />}
                <FaqList items={c.items} idPrefix={c.id} />
              </section>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center gap-6 border-t border-stone-light pt-10">
          <Button href="/contact">Contact us</Button>
          <Button href="/refund-policy" variant="ghost">
            Refund and cancellation policy
          </Button>
        </div>
      </Container>
    </main>
  );
}

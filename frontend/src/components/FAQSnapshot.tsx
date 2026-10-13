import Link from "next/link";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import FaqList from "@/components/content/FaqList";
import { snapshotItems } from "@/app/faq/faq-data";

/** Short list of common questions (shared copy with /faq), used on the contact page. Server component. */
export default function FAQSnapshot() {
  return (
    <section className="border-t border-stone-light py-16 md:py-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[4fr_7fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Quick answers" title="Before you write" />
            <p className="mt-6">
              <Link
                href="/faq"
                className="text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal underline underline-offset-4 decoration-stone hover:decoration-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
              >
                All questions
              </Link>
            </p>
          </div>
          <FaqList items={snapshotItems} idPrefix="snapshot" />
        </div>
      </Container>
    </section>
  );
}

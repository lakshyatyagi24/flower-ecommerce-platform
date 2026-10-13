import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/content/PageHeader";
import ContactDetails from "@/components/content/ContactDetails";
import FAQSnapshot from "@/components/FAQSnapshot";
import ContactForm from "./components/ContactForm";

export default function ContactPage() {
  return (
    <main>
      <div className="py-14 md:py-20">
        <Container>
          <PageHeader
            eyebrow="Contact"
            title="Get in touch"
            intro="Questions about an order, a custom bouquet or an event? Send us a message and we will get back to you."
          />

          <div className="mt-14 grid gap-14 lg:grid-cols-[7fr_5fr] lg:gap-20">
            <section aria-label="Send a message">
              <ContactForm />
            </section>

            <aside aria-label="Other ways to reach us" className="space-y-10">
              <ContactDetails />
              <div>
                <h2 className="type-h3 text-charcoal">Planning an event?</h2>
                <p className="mt-3 text-base leading-relaxed text-stone-dark">
                  Weddings, celebrations and corporate occasions are quoted on request.
                </p>
                <div className="mt-5">
                  <Button href="/corporate" variant="outline">
                    Event and corporate enquiries
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </div>
      <FAQSnapshot />
    </main>
  );
}

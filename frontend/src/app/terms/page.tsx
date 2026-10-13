import Link from "next/link";
import LegalDocument, { LegalSection } from "@/components/content/LegalDocument";
import ContactLines from "@/components/content/ContactLines";
import PolicySummary from "@/components/content/PolicySummary";
import { LEGAL_UPDATED } from "@/lib/content";

/** DRAFT legal copy for owner review (see task-3.7b-report.md); not a substitute for legal advice. */
export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" updated={LEGAL_UPDATED.terms}>
      <LegalSection heading="1. About">
        <p>
          This website is operated by Fresh Petals India. By placing an order or sending an enquiry you agree to these
          terms.
        </p>
      </LegalSection>
      <LegalSection heading="2. Orders">
        <ul>
          <li>Products marked for purchase can be ordered online and paid for with the payment options shown at checkout.</li>
          <li>
            Bouquets, arrangements, hampers and corporate orders are quoted on enquiry. We confirm the price, any GST
            and the delivery details with you before the order is confirmed.
          </li>
          <li>
            Flowers are natural and perishable. Exact varieties, colours and shades can vary with availability, and we
            will tell you if we need to substitute.
          </li>
        </ul>
      </LegalSection>
      <LegalSection heading="3. Pricing and GST">
        <p>Prices are shown in Indian rupees. Where GST applies, it is shown on your order summary and on your invoice.</p>
      </LegalSection>
      <LegalSection heading="4. Delivery">
        <p>
          We deliver in and around Delhi NCR. Delivery charges and dates are shown at checkout, or confirmed with you
          for orders quoted on enquiry. Responsibility for the goods passes to you on delivery.
        </p>
        <PolicySummary kind="delivery" />
      </LegalSection>
      <LegalSection heading="5. Cancellations and refunds">
        <p>
          Our <Link href="/refund-policy">Refund and Cancellation Policy</Link> explains when an order can be cancelled
          and how refunds work. It forms part of these terms.
        </p>
      </LegalSection>
      <LegalSection heading="6. Liability">
        <p>
          Our liability for any order is limited to the amount you paid for it. We are not liable for indirect or
          consequential losses.
        </p>
      </LegalSection>
      <LegalSection heading="7. Changes">
        <p>
          We may update these terms from time to time. The date at the top of this page shows when they last changed.
          Continuing to use the site means you accept the current terms.
        </p>
      </LegalSection>
      <LegalSection heading="8. Contact">
        <ContactLines />
      </LegalSection>
    </LegalDocument>
  );
}

import LegalDocument, { LegalSection } from "@/components/content/LegalDocument";
import ContactLines from "@/components/content/ContactLines";
import PolicySummary from "@/components/content/PolicySummary";
import { LEGAL_UPDATED } from "@/lib/content";

/**
 * DRAFT policy wording for owner review (see task-3.7b-report.md). The earlier page quoted fixed windows
 * (cancel up to 2 hours before the slot, report damage within 4 hours). Those are business decisions nobody
 * has confirmed, so they are replaced by neutral wording; the owner can state exact windows in the
 * `policies.returnsSummary` setting, which is shown at the top of this page when set.
 */
export default function RefundPolicyPage() {
  return (
    <LegalDocument title="Refund and Cancellation Policy" updated={LEGAL_UPDATED.refund}>
      <PolicySummary kind="returns" title="From the shop" className="mt-10" />
      <LegalSection heading="Cut flowers (products you can order online)">
        <ul>
          <li>
            To cancel an order, contact us as soon as possible with your order number. An order that has not yet been
            prepared or dispatched can usually be cancelled, If you have already paid online, we will refund it to the original payment method.
          </li>
          <li>
            If your flowers arrive damaged or in poor condition, contact us promptly with your order number and clear
            photos. We will look into it and arrange a replacement or refund where it is warranted.
          </li>
          <li>Flowers are perishable, so we cannot accept returns of flowers delivered in good condition.</li>
        </ul>
      </LegalSection>
      <LegalSection heading="Bouquets, arrangements and hampers (quoted on enquiry)">
        <ul>
          <li>
            Once you have approved a quote and we have started preparing your order, it may no longer be possible to
            cancel it. We will tell you where you stand when we send the quote.
          </li>
          <li>
            If an arrangement arrives damaged or is not what was agreed, contact us promptly with photos and we will
            work out a replacement or partial refund with you.
          </li>
        </ul>
      </LegalSection>
      <LegalSection heading="How refunds are paid">
        <p>
          Online payments are refunded to the original payment method; for cash on delivery orders we will agree the refund method with you. The time it takes to reach your account
          depends on your bank or payment provider.
        </p>
      </LegalSection>
      <LegalSection heading="How to ask for a refund or cancellation">
        <p>Contact us with your order number and the reason.</p>
        <ContactLines withName={false} />
      </LegalSection>
    </LegalDocument>
  );
}

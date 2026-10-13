import LegalDocument, { LegalSection } from "@/components/content/LegalDocument";
import ContactLines from "@/components/content/ContactLines";
import { LEGAL_UPDATED } from "@/lib/content";

/** DRAFT legal copy for owner review (see task-3.7b-report.md); not a substitute for legal advice. */
export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated={LEGAL_UPDATED.privacy}>
      <LegalSection heading="1. Information we collect">
        <p>
          We collect the information you give us when you place an order, create an account, send an enquiry or
          subscribe to our newsletter: your name, phone number, email address, delivery address and any notes about
          your requirement. If you write a product review, your name and review are shown on the product page. We
          also receive basic device and browser information automatically when you use the site.
        </p>
      </LegalSection>
      <LegalSection heading="2. How we use it">
        <ul>
          <li>To process orders and enquiries and to arrange delivery.</li>
          <li>To contact you about your order or enquiry by phone, WhatsApp or email.</li>
          <li>To send our newsletter, if you subscribed. You can ask us to stop at any time.</li>
          <li>To keep the website working and to improve it.</li>
        </ul>
      </LegalSection>
      <LegalSection heading="3. Sharing">
        <p>
          We do not sell your personal information. We share your details with delivery partners only as far as is
          needed to deliver your order. We also use service providers, such as our hosting provider, our email
          delivery service and our payment gateway, who process your details only to provide their service to us.
          Online payments are processed by the payment gateway, which handles your card or UPI details directly; we
          do not store them.
        </p>
      </LegalSection>
      <LegalSection heading="4. Cookies and local storage">
        <p>
          This site stores your sign-in and your cart in your browser&apos;s local storage so they keep working from page
          to page. We do not use advertising or tracking cookies.
        </p>
      </LegalSection>
      <LegalSection heading="5. Your choices">
        <p>
          You can ask us for a copy of the personal information we hold about you, or ask us to correct or delete it,
          by contacting us using the details below. We may need to keep order records for accounting and tax purposes.
        </p>
      </LegalSection>
      <LegalSection heading="6. Contact">
        <ContactLines />
      </LegalSection>
    </LegalDocument>
  );
}

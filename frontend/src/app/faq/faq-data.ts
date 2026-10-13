/**
 * FAQ copy. DRAFT editorial wording for owner review (see task-3.7b-report.md).
 *
 * Honesty rules: no delivery-time, urgency, free-shipping or freshness-duration claims here (see claims.test.ts). Anything
 * time- or price-specific is answered by pointing at checkout, or comes from store settings (`policies.*`,
 * `delivery.*`) and is rendered separately by <PolicySummary />. This list also feeds the FAQPage JSON-LD,
 * so every answer must be a plain static string.
 */
export type FaqItem = { q: string; a: string; /** Also shown in the short list on the contact page. */ snapshot?: boolean };
export type FaqCategory = { id: string; title: string; items: FaqItem[] };

export const categories: FaqCategory[] = [
  {
    id: "orders",
    title: "Orders",
    items: [
      {
        q: "How do I place an order?",
        a: "Choose your flowers, add them to the cart and go to checkout. Some products, such as bouquets, arrangements and hampers, are quoted on enquiry instead: use the Enquire button on the product page and we will get back to you.",
      },
      {
        q: "Can I change or cancel an order?",
        a: "Contact us as soon as possible with your order number. Once an order has been prepared or dispatched we may not be able to change it, so earlier is always better. See our Refund and Cancellation Policy for details.",
        snapshot: true,
      },
      {
        q: "How can I track my order?",
        a: "Use the Track order page with your order number and the email address you used at checkout. You will see the latest status of your order there.",
      },
      {
        q: "Can I customise a bouquet?",
        a: "Yes. Tell us the flowers, colours, budget and occasion through the Enquire button on a product or through the contact page, and we will confirm what we can arrange and the price before you commit.",
        snapshot: true,
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    items: [
      {
        q: "Where do you deliver?",
        a: "We are based in Delhi NCR and deliver in and around it. If you are not sure we reach your area, send us a message before you order.",
        snapshot: true,
      },
      {
        q: "How much does delivery cost, and can I choose a date?",
        a: "Delivery charges are shown at checkout before you pay. If you need flowers on a particular date, add it to the delivery notes or contact us before ordering and we will tell you honestly what is possible.",
        snapshot: true,
      },
      {
        q: "Can I add delivery instructions?",
        a: "Yes. Add notes at checkout, for example a landmark or who to ask for, and we will pass them on with the delivery.",
      },
      {
        q: "What if the recipient is not available?",
        a: "Please tell us as early as you can. Contact us with your order number and we will work out the best way to get the flowers to them.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments and refunds",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "The payment options available for your order are shown at checkout. Online payments are handled by our payment gateway, Razorpay, so your card or UPI details are never stored by us.",
      },
      {
        q: "What if my flowers arrive damaged or not as described?",
        a: "Contact us with your order number and a clear photo, and we will look into it and arrange a replacement or refund where it is warranted. See our Refund and Cancellation Policy for the full process.",
        snapshot: true,
      },
    ],
  },
  {
    id: "corporate",
    title: "Corporate and events",
    items: [
      {
        q: "Do you handle bulk or corporate orders?",
        a: "Yes. Send your requirement through the Corporate page, with quantity, occasion and date, and we will reply with a quote.",
      },
    ],
  },
];

/** Flat question list for FAQPage structured data. */
export const allFaqItems: FaqItem[] = categories.flatMap((c) => c.items);

/** The short list shown on the contact page. */
export const snapshotItems: FaqItem[] = allFaqItems.filter((i) => i.snapshot);

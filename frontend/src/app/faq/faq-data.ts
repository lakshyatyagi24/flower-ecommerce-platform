export type FaqItem = { q: string; a: string };
export type FaqCategory = { id: string; title: string; items: FaqItem[] };

export const categories: FaqCategory[] = [
  {
    id: "orders",
    title: "Orders",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard delivery in metro cities is same-day or next-day depending on cut-off times. Rural areas may take 2-3 days. You can get a delivery estimate on the product page and at checkout by entering the pin code.",
      },
      {
        q: "Can I change or cancel an order?",
        a: "You can request changes within 30 minutes of placing an order. After dispatch we cannot guarantee changes; please contact support immediately and we'll do our best to help.",
      },
      {
        q: "What if the recipient is unavailable?",
        a: "Our courier follows any delivery instructions you provide. If the recipient is unavailable, the courier will attempt a safe handover (neighbor/concierge) or return to the local depot and notify you. Re-delivery fees may apply in some areas.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "We accept major credit/debit cards, net banking, UPI and popular wallets. All payments are processed through secure, encrypted gateways.",
      },
      {
        q: "How do refunds work?",
        a: "If an item is eligible for a refund (damaged or not as described), we'll process refunds after we verify the issue—typically within 5–7 business days depending on the payment provider.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    items: [
      {
        q: "Do you offer same-day delivery?",
        a: "Same-day delivery is available in selected metro locations for orders placed before the cut-off time. Delivery availability is shown on the product page and at checkout.",
      },
      {
        q: "Can I provide delivery instructions?",
        a: "Yes — you can add delivery instructions at checkout (e.g., leave with neighbor, call before delivery). We pass this to the courier.",
      },
    ],
  },
  {
    id: "corporate",
    title: "Corporate & Events",
    items: [
      {
        q: "Do you handle bulk or corporate orders?",
        a: "Yes. For bulk or event orders, contact our Events team via the Contact page so we can provide a custom quote, scheduling, and dedicated support.",
      },
    ],
  },
];

/** Flat question list for FAQPage structured data. */
export const allFaqItems: FaqItem[] = categories.flatMap((c) => c.items);

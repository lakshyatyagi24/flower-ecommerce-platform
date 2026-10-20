import React from "react";
import Link from "next/link";
import type { ApiOrder } from "@/lib/api";
import PaymentActions from "@/components/PaymentActions";
import { textLink } from "@/components/ui/form-styles";
import { EXPIRED_COPY, expiredKindOf, type PayController } from "@/lib/use-pay-for-order";
import { outcomeOf, RESERVED_NOTE, type Outcome } from "./success-logic";

type OutcomeProps = { order: ApiOrder; pay: PayController; payEnabled: boolean };

const CONFIRMED_COPY = "has been confirmed. We'll be in touch shortly with delivery details.";

function RefundExpired() {
  return (
    <div className="mt-3" role="status">
      <p>
        Your payment was received after the order expired. We will refund it — contact us if you don&apos;t hear from
        us in 3 working days.
      </p>
      <p className="mt-3">
        <Link href="/contact" className={textLink}>
          Contact us
        </Link>
      </p>
    </div>
  );
}

function Cancelled({ order }: OutcomeProps) {
  return (
    <div className="mt-3" role="status">
      <p>{EXPIRED_COPY[expiredKindOf(order)]}</p>
      <p className="mt-3">
        <Link href="/products" className={textLink}>
          Browse products
        </Link>
      </p>
    </div>
  );
}

function Pending({ order, pay, payEnabled }: OutcomeProps) {
  return (
    <div className="mt-3">
      {!pay.switched && <p>Your order #{order.id} is waiting for payment. {RESERVED_NOTE}</p>}
      <PaymentActions pay={pay} orderId={order.id} allowPay={payEnabled} />
    </div>
  );
}

const Confirmed = ({ order }: OutcomeProps) => (
  <p className="mt-3">
    Your order #{order.id} {CONFIRMED_COPY}
  </p>
);

const Processing = ({ order }: OutcomeProps) => <p className="mt-3">Your order #{order.id} is being processed.</p>;

const BODIES: Record<Outcome, (p: OutcomeProps) => React.ReactNode> = {
  "refund-expired": () => <RefundExpired />,
  cancelled: (p) => <Cancelled {...p} />,
  pending: (p) => <Pending {...p} />,
  "paid-online": (p) => <Confirmed {...p} />,
  cod: (p) => <Confirmed {...p} />,
  processing: (p) => <Processing {...p} />,
};

function headingFor(outcome: Outcome, order: ApiOrder, switched: boolean): string {
  switch (outcome) {
    case "refund-expired":
      return "Order expired — refund due";
    case "cancelled":
      return expiredKindOf(order) === "unpaid" ? "Order expired" : "Order cancelled";
    case "pending":
      return switched ? "Refund due" : "Payment pending";
    case "paid-online":
      return "Payment received";
    case "cod":
      return "Order placed — pay on delivery";
    default:
      return "Order received";
  }
}

/** The heading and explanation for where the order stands (paid, pending, cancelled, pay on delivery...). */
export default function OrderOutcome(props: OutcomeProps) {
  const outcome = outcomeOf(props.order);
  return (
    <>
      <h2 className="font-display text-3xl text-charcoal md:text-4xl">
        {headingFor(outcome, props.order, props.pay.switched)}
      </h2>
      {BODIES[outcome](props)}
    </>
  );
}

import type { ApiOrder } from "@/lib/api";

type PaymentFields = Pick<ApiOrder, "paymentMethod" | "paymentStatus" | "status">;

/** Payment state label for the orders list. */
export function paymentLabel(o: PaymentFields): string {
  if (o.paymentStatus === "REFUNDED") return "Refunded";
  if (o.paymentStatus === "PAID") return o.status === "CANCELLED" ? "Paid — refund due" : "Paid";
  if (o.paymentMethod === "COD") return "Cash on delivery";
  if (o.status === "CANCELLED") return "Payment not completed";
  return "Payment pending";
}

/** Payment state line for the confirmation page (distinct wording from the page headings). */
export function paymentLine(o: PaymentFields): string {
  if (o.paymentStatus === "REFUNDED") return "Refunded";
  if (o.paymentStatus === "PAID") return o.status === "CANCELLED" ? "Paid online — refund due" : "Paid online";
  if (o.paymentMethod === "COD") return "Cash on delivery";
  if (o.status === "CANCELLED") return "Not paid";
  return "Awaiting payment";
}

/** Pending online order that can still be paid. */
export function canPayNow(o: PaymentFields): boolean {
  return (
    o.paymentMethod === "RAZORPAY" &&
    o.status === "PENDING" &&
    (o.paymentStatus === "UNPAID" || o.paymentStatus === "FAILED")
  );
}

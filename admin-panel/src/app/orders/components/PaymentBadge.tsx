import { Badge } from "@/components/ui/badge";
import type { AdminOrder } from "@/lib/api";
import { paymentBadge } from "@/lib/refund-note";
import { toneVariant } from "../constants";

export function PaymentBadge({ order }: { order: AdminOrder }) {
  const b = paymentBadge(order);
  return (
    <Badge variant={toneVariant(b.tone)} title={b.hint}>
      {b.label}
    </Badge>
  );
}

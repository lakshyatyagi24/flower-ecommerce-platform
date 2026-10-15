"use client";

import React from "react";
import { formatINR } from "@/lib/cart-context";
import Container from "@/components/ui/Container";
import PaymentActions from "@/components/PaymentActions";
import type { PayController } from "@/lib/use-pay-for-order";

export default function PendingPanel({
  pay,
  pendingId,
  pendingAmounts,
}: {
  pay: PayController;
  pendingId: number;
  pendingAmounts: { total: number; discount: number; couponCode: string | null } | null;
}) {
  return (
      <main>
        <Container className="py-12 lg:py-20">
          <div className="max-w-xl">
            <h1 className="type-h2">{pay.switched ? "Refund due" : "Payment pending"}</h1>
            {!pay.switched && (
              <p className="mt-4 text-base leading-relaxed text-stone-dark">
                Your order #{pendingId} has been created and is waiting for payment. It stays reserved for 30 minutes.
              </p>
            )}
            {pendingAmounts && (
              <p className="mt-4 text-base text-charcoal" data-testid="pending-amounts">
                Amount to pay: <strong className="font-medium">{formatINR(pendingAmounts.total)}</strong>
                {pendingAmounts.discount > 0 && (
                  <span className="block text-sm text-stone-dark">
                    Includes a discount of {formatINR(pendingAmounts.discount)}
                    {pendingAmounts.couponCode ? ` (coupon ${pendingAmounts.couponCode})` : ""}.
                  </span>
                )}
              </p>
            )}
            <PaymentActions pay={pay} orderId={pendingId} />
          </div>
        </Container>
      </main>
  );
}

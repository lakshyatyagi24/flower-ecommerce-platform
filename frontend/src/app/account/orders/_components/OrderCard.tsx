"use client";

import React from "react";
import type { ApiOrder } from "@/lib/api";
import { formatINR } from "@/lib/cart-context";
import { formatDeliveryDate } from "@/lib/delivery-date";
import { canPayNow, paymentLabel } from "@/lib/order-labels";
import { setTrackEmail } from "@/lib/track-order-session";
import { usePayForOrder } from "@/lib/use-pay-for-order";
import PaymentActions from "@/components/PaymentActions";
import Button from "@/components/ui/Button";

// Pay now (and Check status after a problem) for one order. Resolving the order
// clears the cart / pending key inside the hook, then we refresh the list.
function OrderPayment({ order, onResolved }: { order: ApiOrder; onResolved: () => void }) {
  const pay = usePayForOrder({ orderId: order.id, onResolved });
  return <PaymentActions pay={pay} orderId={order.id} allowSwitch={false} />;
}

function OrderHeading({ order }: { order: ApiOrder }) {
  const units = order.items.reduce((n, it) => n + it.quantity, 0);
  const deliveryDate = order.deliveryDate ? formatDeliveryDate(order.deliveryDate) : "";
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="font-display text-2xl text-charcoal">Order #{order.id}</h2>
        <p className="mt-1 text-sm text-stone-dark">
          {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })} · {units} {units === 1 ? "item" : "items"}
        </p>
        {deliveryDate && <p className="mt-1 text-sm text-charcoal">Delivery date: {deliveryDate}</p>}
      </div>
      <div className="md:text-right">
        <p className="text-xs font-medium tracking-[0.16em] text-charcoal">{order.status}</p>
        <p className="mt-1 text-sm text-stone-dark">{paymentLabel(order)}</p>
      </div>
    </div>
  );
}

function ItemLines({ order }: { order: ApiOrder }) {
  return (
    <ul className="mt-6 space-y-2 text-sm text-charcoal">
      {order.items.map((it) => (
        <li key={it.id} className="flex justify-between gap-4">
          <span>
            {it.quantity} × {it.productName}
          </span>
          <span className="shrink-0 whitespace-nowrap">{formatINR(it.unitPrice * it.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}

function AmountRow({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="flex justify-between gap-4" data-testid={testId}>
      <dt>{label}</dt>
      <dd className="text-charcoal">{children}</dd>
    </div>
  );
}

function Amounts({ order }: { order: ApiOrder }) {
  const discount = order.discount ?? 0;
  const gst = order.gst ?? 0;
  return (
    <dl className="mt-6 space-y-2 border-t border-stone-light pt-4 text-sm text-stone-dark">
      <AmountRow label="Subtotal">{formatINR(order.subtotal)}</AmountRow>
      {discount > 0 && (
        <AmountRow label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} testId="order-discount">
          -{formatINR(discount)}
        </AmountRow>
      )}
      <AmountRow label="Shipping">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</AmountRow>
      {gst > 0 && <AmountRow label="GST">{formatINR(gst)}</AmountRow>}
      <div className="flex justify-between gap-4 pt-2 text-base text-charcoal">
        <dt>Total</dt>
        <dd className="font-display text-xl">{formatINR(order.total)}</dd>
      </div>
    </dl>
  );
}

type OrderCardProps = { order: ApiOrder; fallbackEmail: string; onResolved: () => void };

export default function OrderCard({ order, fallbackEmail, onResolved }: OrderCardProps) {
  return (
    <article className="border-b border-stone-light py-8">
      <OrderHeading order={order} />
      <ItemLines order={order} />
      <Amounts order={order} />
      <div className="mt-2">
        {canPayNow(order) && <OrderPayment order={order} onResolved={onResolved} />}
        <div className="mt-2">
          <Button
            variant="ghost"
            href={`/track-order/results?orderId=${order.id}`}
            onClick={() => setTrackEmail(order.customerEmail || fallbackEmail)}
          >
            View details
          </Button>
        </div>
      </div>
    </article>
  );
}

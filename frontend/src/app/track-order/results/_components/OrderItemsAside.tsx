import React from "react";
import Image from "next/image";
import type { ApiOrder } from "@/lib/api";
import { formatINR } from "@/lib/cart-context";
import { productImage } from "@/lib/product-image";
import { paymentLine } from "@/lib/order-labels";
import { sectionLabel } from "./tracking-logic";

function ItemRow({ item }: { item: ApiOrder["items"][number] }) {
  return (
    <li className="flex gap-4">
      <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-sm bg-ivory-deep lg:bg-ivory">
        <Image src={productImage(item.product)} alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="text-charcoal">{item.productName}</div>
        <div className="mt-1 text-stone-dark">
          Qty {item.quantity} × {formatINR(item.unitPrice)}
        </div>
      </div>
      <div className="text-sm text-charcoal">{formatINR(item.unitPrice * item.quantity)}</div>
    </li>
  );
}

function SummaryRow({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="flex justify-between gap-4" data-testid={testId}>
      <dt>{label}</dt>
      <dd className="text-charcoal">{children}</dd>
    </div>
  );
}

function OrderTotals({ order }: { order: ApiOrder }) {
  const discount = order.discount ?? 0;
  const gst = order.gst ?? 0;
  return (
    <dl className="mt-6 space-y-3 border-t border-stone-light pt-6 text-sm text-stone-dark">
      <SummaryRow label="Payment">{paymentLine(order)}</SummaryRow>
      <SummaryRow label="Subtotal">{formatINR(order.subtotal)}</SummaryRow>
      {discount > 0 && (
        <SummaryRow label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} testId="order-discount">
          -{formatINR(discount)}
        </SummaryRow>
      )}
      <SummaryRow label="Shipping">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</SummaryRow>
      {gst > 0 && <SummaryRow label="GST">{formatINR(gst)}</SummaryRow>}
      <div className="flex justify-between gap-4 border-t border-stone-light pt-4 text-base text-charcoal">
        <dt>Total</dt>
        <dd className="font-display text-2xl">{formatINR(order.total)}</dd>
      </div>
    </dl>
  );
}

export default function OrderItemsAside({ order }: { order: ApiOrder }) {
  return (
    <aside aria-labelledby="items-heading" className="lg:col-span-5 lg:self-start lg:bg-ivory-deep lg:p-8">
      <h2 id="items-heading" className={`${sectionLabel} mb-6`}>
        Items in this order
      </h2>
      <ul className="space-y-5">
        {order.items.map((it) => (
          <ItemRow key={it.id} item={it} />
        ))}
      </ul>
      <OrderTotals order={order} />
    </aside>
  );
}

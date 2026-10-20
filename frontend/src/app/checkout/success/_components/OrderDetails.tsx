import React from "react";
import Image from "next/image";
import type { ApiOrder } from "@/lib/api";
import { formatINR } from "@/lib/cart-context";
import { formatDeliveryDate } from "@/lib/delivery-date";
import { paymentLine } from "@/lib/order-labels";
import { productImage } from "@/lib/product-image";

const dtClass = "text-xs font-medium uppercase tracking-[0.16em] text-stone-dark";

function DetailRow({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className={dtClass}>{label}</dt>
      {children}
    </div>
  );
}

function DeliveringTo({ order }: { order: ApiOrder }) {
  const cityLine = [order.city, order.postalCode].filter(Boolean).join(order.city && order.postalCode ? ", " : "");
  return (
    <DetailRow label="Delivering to" wide>
      <dd className="mt-2 text-base leading-relaxed text-charcoal">
        {order.customerName && <span className="block">{order.customerName}</span>}
        {order.shippingAddress && <span className="block whitespace-pre-line">{order.shippingAddress}</span>}
        {cityLine && <span className="block">{cityLine}</span>}
      </dd>
    </DetailRow>
  );
}

function DetailsList({ order }: { order: ApiOrder }) {
  const deliveryDate = formatDeliveryDate(order.deliveryDate);
  const hasAddress = Boolean(order.shippingAddress || order.city || order.postalCode);
  return (
    <dl className="mt-10 grid grid-cols-1 gap-8 border-t border-stone-light pt-8 text-sm sm:grid-cols-2">
      <DetailRow label="Order number">
        <dd className="mt-2 text-base text-charcoal">#{order.id}</dd>
      </DetailRow>
      <DetailRow label="Payment">
        <dd className="mt-2 text-base text-charcoal">{paymentLine(order)}</dd>
      </DetailRow>
      {deliveryDate && (
        <DetailRow label="Delivery date" wide>
          <dd className="mt-2 text-base text-charcoal">{deliveryDate}</dd>
        </DetailRow>
      )}
      {hasAddress && <DeliveringTo order={order} />}
    </dl>
  );
}

function ItemRow({ item }: { item: ApiOrder["items"][number] }) {
  return (
    <li className="flex items-center gap-4 py-4">
      <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-sm bg-ivory-deep">
        <Image src={productImage(item.product)} alt="" fill sizes="48px" className="object-cover" />
      </div>
      <span className="min-w-0 flex-1 text-sm text-charcoal">
        {item.productName} × {item.quantity}
      </span>
      {typeof item.unitPrice === "number" && (
        <span className="text-sm text-charcoal">{formatINR(item.unitPrice * item.quantity)}</span>
      )}
    </li>
  );
}

function Totals({ order }: { order: ApiOrder }) {
  return (
    <>
      {typeof order.discount === "number" && order.discount > 0 && (
        <div className="mt-6 flex items-baseline justify-between text-sm text-charcoal" data-testid="order-discount">
          <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
          <span>-{formatINR(order.discount)}</span>
        </div>
      )}
      <div className="mt-6 flex items-baseline justify-between text-charcoal">
        <span className="text-sm uppercase tracking-[0.12em]">Total</span>
        <span className="font-display text-2xl">{formatINR(order.total)}</span>
      </div>
    </>
  );
}

/** Order number, payment, delivery details, the items and the totals. */
export default function OrderDetails({ order }: { order: ApiOrder }) {
  return (
    <>
      <DetailsList order={order} />
      <ul className="mt-10 divide-y divide-stone-light border-y border-stone-light">
        {order.items.map((it) => (
          <ItemRow key={it.id} item={it} />
        ))}
      </ul>
      <Totals order={order} />
    </>
  );
}

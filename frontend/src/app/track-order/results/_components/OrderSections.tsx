import React from "react";
import type { ApiOrder } from "@/lib/api";
import OrderTimeline from "@/components/OrderTimeline";
import { formatDeliveryDate } from "@/lib/delivery-date";
import { buildPhases, sectionLabel } from "./tracking-logic";

export function OrderHeader({ order }: { order: ApiOrder }) {
  const placedAt = new Date(order.createdAt);
  return (
    <header className="flex flex-col gap-3 border-b border-stone-light pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="type-h1">Order #{order.id}</h1>
        <p className="mt-3 text-sm text-stone-dark">Placed {placedAt.toLocaleDateString(undefined, { dateStyle: "long" })}</p>
      </div>
      <div className="sm:text-right">
        <p className={sectionLabel}>Status</p>
        <p className="mt-1 text-sm font-medium tracking-[0.16em] text-charcoal">{order.status}</p>
      </div>
    </header>
  );
}

export function ProgressSection({ order }: { order: ApiOrder }) {
  const { phases, currentIndex } = buildPhases(order);
  return (
    <section aria-labelledby="progress-heading">
      <h2 id="progress-heading" className={`${sectionLabel} mb-6`}>
        Order progress
      </h2>
      <OrderTimeline phases={phases} currentIndex={currentIndex} />
    </section>
  );
}

export function ShipmentSection({ order }: { order: ApiOrder }) {
  if (!order.trackingNumber) return null;
  return (
    <section aria-labelledby="shipment-heading">
      <h2 id="shipment-heading" className={`${sectionLabel} mb-3`}>
        Shipment tracking
      </h2>
      {/* Courier and tracking number are plain text: never turned into links. */}
      <p className="text-base text-charcoal">
        {order.courierName && <span className="block text-sm text-stone-dark">{order.courierName}</span>}
        <span className="break-all">{order.trackingNumber}</span>
      </p>
    </section>
  );
}

function DeliveryDate({ deliveryDate }: { deliveryDate: ApiOrder["deliveryDate"] }) {
  const formatted = formatDeliveryDate(deliveryDate);
  if (!formatted) return null;
  return (
    <p className="mb-3 text-base text-charcoal">
      <span className="block text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">Delivery date</span>
      <span className="mt-1 block">{formatted}</span>
    </p>
  );
}

function CityLine({ city, postalCode }: Pick<ApiOrder, "city" | "postalCode">) {
  if (!city && !postalCode) return null;
  return (
    <div>
      {city}
      {city && postalCode ? ", " : ""}
      {postalCode}
    </div>
  );
}

export function DeliverySection({ order }: { order: ApiOrder }) {
  return (
    <section aria-labelledby="delivery-heading">
      <h2 id="delivery-heading" className={`${sectionLabel} mb-3`}>
        Delivery details
      </h2>
      <DeliveryDate deliveryDate={order.deliveryDate} />
      <div className="text-base leading-relaxed text-charcoal">
        {order.customerName && <div>{order.customerName}</div>}
        {order.customerPhone && <div>{order.customerPhone}</div>}
        {order.shippingAddress && <div className="whitespace-pre-line">{order.shippingAddress}</div>}
        <CityLine city={order.city} postalCode={order.postalCode} />
      </div>
      {order.notes && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-dark">
          <span className="block text-xs font-medium uppercase tracking-[0.16em]">Delivery notes</span>
          <span className="mt-1 block">{order.notes}</span>
        </p>
      )}
    </section>
  );
}

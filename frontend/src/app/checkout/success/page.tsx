"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError, api } from "@/lib/api";
import { EXPIRED_COPY, expiredKindOf, usePayForOrder } from "@/lib/use-pay-for-order";
import PaymentActions from "@/components/PaymentActions";
import { useApi } from "@/lib/use-api";
import { clearLastOrderEmail, getLastOrderEmail } from "@/lib/guest-order";
import { formatINR } from "@/lib/cart-context";
import ErrorState from "@/components/ui/ErrorState";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Image from "next/image";
import { productImage } from "@/lib/product-image";
import { paymentLine } from "@/lib/order-labels";
import { formatDeliveryDate } from "@/lib/delivery-date";
import { textLink } from "@/components/ui/form-styles";


const RESERVED_NOTE = "Your order is reserved for 30 minutes from when it was placed. After that it is cancelled automatically.";

const GUEST_LOOKUP_COPY =
  "We couldn't show your order details here, but if you completed checkout your order was placed. Check your confirmation email, or look it up with your order number and the email you ordered with.";

/**
 * Signed-in customers read the order through their account. A guest reads it with the order's email, handed over
 * in sessionStorage by checkout (never the URL) and removed again once the order is shown in a final state.
 */
function OrderSummary({ orderId, guestEmail }: { orderId: number; guestEmail: string | null }) {
  const { user } = useAuth();
  // Set when the order had to be read with the email (a guest order viewed after signing in): its key is spent too.
  const viaEmail = useRef(false);
  const { data: order, error, loading, reload } = useApi(async () => {
    if (!user && guestEmail) return api.trackOrder(orderId, guestEmail);
    try {
      return await api.getMyOrder(orderId);
    } catch (e) {
      if (guestEmail && e instanceof ApiError && (e.status === 403 || e.status === 404)) {
        viaEmail.current = true;
        return api.trackOrder(orderId, guestEmail);
      }
      throw e;
    }
  }, [orderId]);
  // The email has done its job once the order is displayed, unless the shopper still has to pay: then Pay now,
  // Check status and Switch to COD need it (and so does the reload after they resolve).
  useEffect(() => {
    if ((user && !viaEmail.current) || !order) return;
    const stillPayable =
      order.paymentMethod === "RAZORPAY" &&
      order.status === "PENDING" &&
      (order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED");
    if (!stillPayable) clearLastOrderEmail();
  }, [user, order]);
  // Every resolution (paid / refund due / switched to COD / expired) clears the
  // cart and a matching pending key inside the hook; we just reload the order.
  const pay = usePayForOrder({ orderId, onResolved: () => reload() });
  // Hide "Pay now" when online payments are off. Unknown (loading/failed) keeps it: the order already exists.
  const { data: paymentConfig } = useApi(() => api.getPaymentConfig(), []);
  const payEnabled = paymentConfig?.enabled !== false;

  if (loading && !order) {
    return <Skeleton className="mt-8 h-40" />;
  }
  if (error || !order) {
    return (
      <ErrorState
        message={
          user
            ? "We couldn't load your order details, but your order was placed. You can find it in your orders."
            : "We couldn't load your order details, but your order was placed. Check your confirmation email, or track it with your order number and email."
        }
        onRetry={reload}
        link={user ? { href: "/account/orders", label: "View my orders" } : { href: "/track-order", label: "Track an order" }}
      />
    );
  }

  const online = order.paymentMethod === "RAZORPAY";
  const unpaid = order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED";
  const cancelled = order.status === "CANCELLED";
  const paid = order.paymentStatus === "PAID";
  const pending = online && order.status === "PENDING" && unpaid;

  let heading: string;
  let body: React.ReactNode;
  if (cancelled && paid) {
    heading = "Order expired — refund due";
    body = (
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
  } else if (cancelled) {
    heading = expiredKindOf(order) === "unpaid" ? "Order expired" : "Order cancelled";
    body = (
      <div className="mt-3" role="status">
        <p>{EXPIRED_COPY[expiredKindOf(order)]}</p>
        <p className="mt-3">
          <Link href="/products" className={textLink}>
            Browse products
          </Link>
        </p>
      </div>
    );
  } else if (pending) {
    heading = pay.switched ? "Refund due" : "Payment pending";
    body = (
      <div className="mt-3">
        {!pay.switched && <p>Your order #{order.id} is waiting for payment. {RESERVED_NOTE}</p>}
        <PaymentActions pay={pay} orderId={order.id} allowPay={payEnabled} />
      </div>
    );
  } else if (online && paid) {
    heading = "Payment received";
    body = (
      <p className="mt-3">
        Your order #{order.id} has been confirmed. We&apos;ll be in touch shortly with delivery details.
      </p>
    );
  } else if (!online) {
    heading = "Order placed — pay on delivery";
    body = (
      <p className="mt-3">
        Your order #{order.id} has been confirmed. We&apos;ll be in touch shortly with
        delivery details.
      </p>
    );
  } else {
    heading = "Order received";
    body = <p className="mt-3">Your order #{order.id} is being processed.</p>;
  }

  const deliveryDate = formatDeliveryDate(order.deliveryDate);
  const hasAddress = Boolean(order.shippingAddress || order.city || order.postalCode);
  const cityLine = [order.city, order.postalCode].filter(Boolean).join(order.city && order.postalCode ? ", " : "");

  return (
    <div className="mt-10 border-t border-stone-light pt-10 text-base leading-relaxed text-stone-dark">
      <h2 className="font-display text-3xl text-charcoal md:text-4xl">{heading}</h2>
      {body}

      <dl className="mt-10 grid grid-cols-1 gap-8 border-t border-stone-light pt-8 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">Order number</dt>
          <dd className="mt-2 text-base text-charcoal">#{order.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">Payment</dt>
          <dd className="mt-2 text-base text-charcoal">{paymentLine(order)}</dd>
        </div>
        {deliveryDate && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">Delivery date</dt>
            <dd className="mt-2 text-base text-charcoal">{deliveryDate}</dd>
          </div>
        )}
        {hasAddress && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-[0.16em] text-stone-dark">Delivering to</dt>
            <dd className="mt-2 text-base leading-relaxed text-charcoal">
              {order.customerName && <span className="block">{order.customerName}</span>}
              {order.shippingAddress && <span className="block whitespace-pre-line">{order.shippingAddress}</span>}
              {cityLine && <span className="block">{cityLine}</span>}
            </dd>
          </div>
        )}
      </dl>

      <ul className="mt-10 divide-y divide-stone-light border-y border-stone-light">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center gap-4 py-4">
            <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-sm bg-ivory-deep">
              <Image src={productImage(it.product)} alt="" fill sizes="48px" className="object-cover" />
            </div>
            <span className="min-w-0 flex-1 text-sm text-charcoal">
              {it.productName} × {it.quantity}
            </span>
            {typeof it.unitPrice === "number" && (
              <span className="text-sm text-charcoal">{formatINR(it.unitPrice * it.quantity)}</span>
            )}
          </li>
        ))}
      </ul>
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
    </div>
  );
}

function CheckoutSuccessView() {
  const params = useSearchParams();
  const rawId = params?.get("orderId");
  const orderId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;
  const { user, loading: authLoading } = useAuth();

  // Read the guest's email once, after mount, and keep it in memory: storage is cleared once the order is shown,
  // but a later reload (after paying) still needs it. `undefined` = not read yet.
  const [guestEmail, setGuestEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (authLoading) return;
    setGuestEmail((prev) => (prev === undefined ? getLastOrderEmail() : prev));
  }, [authLoading]);

  if (authLoading || guestEmail === undefined) {
    return (
      <main>
        <Container className="py-16" aria-busy="true">
          <Skeleton className="h-10 w-1/3" />
        </Container>
      </main>
    );
  }

  const guest = !user;
  return (
    <main>
      <Container className="py-12 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="type-h1">Your order</h1>
          {orderId && (user || guestEmail) ? (
            <OrderSummary orderId={orderId} guestEmail={guestEmail ?? null} />
          ) : (
            <ErrorState
              message={orderId ? GUEST_LOOKUP_COPY : "We couldn't find that order."}
              link={guest ? { href: "/track-order", label: "Track an order" } : { href: "/account/orders", label: "View my orders" }}
            />
          )}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            {guest ? (
              <Button href="/track-order" className="w-full sm:w-auto">
                Track an order
              </Button>
            ) : (
              <Button href="/account/orders" className="w-full sm:w-auto">
                View my orders
              </Button>
            )}
            <Button href="/products" variant="ghost">
              Continue shopping
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main>
          <Container className="py-16" aria-busy="true">
            <Skeleton className="h-10 w-1/3" />
          </Container>
        </main>
      }
    >
      <CheckoutSuccessView />
    </Suspense>
  );
}

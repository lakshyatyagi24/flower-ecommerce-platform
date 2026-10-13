"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { EXPIRED_COPY, expiredKindOf, usePayForOrder } from "@/lib/use-pay-for-order";
import PaymentActions from "@/components/PaymentActions";
import { useApi } from "@/lib/use-api";
import { safeRedirect } from "@/lib/safe-redirect";
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

function OrderSummary({ orderId }: { orderId: number }) {
  const { data: order, error, loading, reload } = useApi(() => api.getMyOrder(orderId), [orderId]);
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
        message="We couldn't load your order details, but your order was placed. You can find it in your orders."
        onRetry={reload}
        link={{ href: "/account/orders", label: "View my orders" }}
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
      <div className="mt-6 flex items-baseline justify-between text-charcoal">
        <span className="text-sm uppercase tracking-[0.12em]">Total</span>
        <span className="font-display text-2xl">{formatINR(order.total)}</span>
      </div>
    </div>
  );
}

function CheckoutSuccessView() {
  const router = useRouter();
  const params = useSearchParams();
  const rawId = params?.get("orderId");
  const orderId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;
  const { user, loading: authLoading } = useAuth();

  // The order is loaded through the authenticated /orders/mine endpoint; guests
  // are sent to login with a safe callback back to this page.
  useEffect(() => {
    if (authLoading || user) return;
    const back = safeRedirect(orderId ? `/checkout/success?orderId=${orderId}` : "/account/orders") || "/account/orders";
    router.replace(`/account/login?callbackUrl=${encodeURIComponent(back)}`);
  }, [authLoading, user, orderId, router]);

  if (authLoading || !user) {
    return (
      <main>
        <Container className="py-16" aria-busy="true">
          <Skeleton className="h-10 w-1/3" />
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container className="py-12 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="type-h1">Your order</h1>
          {orderId ? (
            <OrderSummary orderId={orderId} />
          ) : (
            <ErrorState
              message="We couldn't find that order."
              link={{ href: "/account/orders", label: "View my orders" }}
            />
          )}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/account/orders" className="w-full sm:w-auto">
              View my orders
            </Button>
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

"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { ApiOrder } from "@/lib/api";
import Container from "@/components/ui/Container";
import Skeleton from "@/components/ui/Skeleton";
import OrderItemsAside from "./_components/OrderItemsAside";
import { DeliverySection, OrderHeader, ProgressSection, ShipmentSection } from "./_components/OrderSections";
import { LoadingScreen, NotFoundScreen, ResultsFooter } from "./_components/ResultsScreens";
import { useTrackedOrder } from "./_components/use-tracked-order";

function OrderDetails({ order }: { order: ApiOrder }) {
  return (
    <main>
      <Container className="py-10 lg:py-16">
        <OrderHeader order={order} />
        {order.status === "CANCELLED" && (
          <p className="mt-8 border border-stone-light px-4 py-3 text-sm leading-relaxed text-charcoal">
            This order was cancelled. If this is unexpected, please reach out to support.
          </p>
        )}
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
          <div className="space-y-12 lg:col-span-7">
            <ProgressSection order={order} />
            <ShipmentSection order={order} />
            <DeliverySection order={order} />
          </div>
          <OrderItemsAside order={order} />
        </div>
        <ResultsFooter />
      </Container>
    </main>
  );
}

function TrackOrderResultsView() {
  const params = useSearchParams();
  const orderId = params?.get("orderId") || "";
  const { order, loading, error } = useTrackedOrder(orderId);
  if (loading) return <LoadingScreen />;
  if (error || !order) return <NotFoundScreen error={error} orderId={orderId} />;
  return <OrderDetails order={order} />;
}

function SuspenseFallback() {
  return (
    <main>
      <Container className="py-12" aria-busy="true">
        <Skeleton className="h-10 w-1/3" />
      </Container>
    </main>
  );
}

export default function TrackOrderResults() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <TrackOrderResultsView />
    </Suspense>
  );
}

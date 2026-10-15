"use client";

import React from "react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { EXPIRED_COPY, type ExpiredKind } from "@/lib/use-pay-for-order";

export default function ExpiredPanel({ expired, onBack }: { expired: ExpiredKind; onBack: () => void }) {
  return (
      <main>
        <Container className="py-12 lg:py-20">
          <div className="max-w-xl">
            <h1 className="type-h2">
              {expired === "unpaid" ? "Order expired" : expired === "refunded" ? "Payment refunded" : "Order cancelled"}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-stone-dark">{EXPIRED_COPY[expired]}</p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Button type="button" onClick={onBack}>
                Back to checkout
              </Button>
              <Button variant="ghost" href="/products">
                Continue shopping — browse products
              </Button>
            </div>
          </div>
        </Container>
      </main>
  );
}

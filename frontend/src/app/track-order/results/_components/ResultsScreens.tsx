import React from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { textLink } from "@/components/ui/form-styles";
import { retryHref } from "./tracking-logic";

export function LoadingScreen() {
  return (
    <main>
      <Container className="py-12 lg:py-16" aria-busy="true">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="mt-4 h-4 w-1/4" />
        <Skeleton className="mt-10 h-64" />
      </Container>
    </main>
  );
}

export function NotFoundScreen({ error, orderId }: { error: string | null; orderId: string }) {
  return (
    <main>
      <Container className="py-16 lg:py-24">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="type-h2">We couldn&apos;t find that order</h1>
          <p role="alert" className="mt-4 text-base leading-relaxed text-stone-dark">
            {error}
          </p>
          <div className="mt-8">
            <Button href={retryHref(orderId)}>Try again</Button>
          </div>
        </div>
      </Container>
    </main>
  );
}

export function ResultsFooter() {
  return (
    <div className="mt-12 flex flex-col gap-3 border-t border-stone-light pt-8 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-stone-dark">
        Need help?{" "}
        <Link href="/contact" className={`text-charcoal ${textLink}`}>
          Contact support
        </Link>
      </p>
      <Button variant="ghost" href="/products">
        Continue shopping
      </Button>
    </div>
  );
}

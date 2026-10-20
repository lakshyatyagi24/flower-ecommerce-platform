import React from "react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";

type SkeletonScreenProps = { rows: string[]; containerClass?: string };

/** Placeholder shown while auth, a remembered order or the checkout data is still loading. */
export function SkeletonScreen({ rows, containerClass = "py-12 lg:py-16" }: SkeletonScreenProps) {
  return (
    <main>
      <Container className={containerClass}>
        <div className="max-w-3xl space-y-4" aria-busy="true">
          {rows.map((cls, i) => (
            <Skeleton key={i} className={cls} />
          ))}
        </div>
      </Container>
    </main>
  );
}

export function LoadErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main>
      <Container className="py-12">
        <ErrorState message="We couldn't load delivery charges. Please refresh." onRetry={onRetry} />
      </Container>
    </main>
  );
}

export function OptionsErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main>
      <Container className="py-12">
        <ErrorState message="We couldn't load the available delivery dates. Please try again." onRetry={onRetry} />
      </Container>
    </main>
  );
}

export function EmptyCartScreen() {
  return (
    <main>
      <Container className="py-16 text-center lg:py-24">
        <h1 className="type-h2">Your cart is empty</h1>
        <p className="mt-4 text-base text-stone-dark">Add some florals before you can check out.</p>
        <div className="mt-8">
          <Button href="/products">Browse florals</Button>
        </div>
      </Container>
    </main>
  );
}

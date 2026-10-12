import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="py-28 text-center">
      <Container>
        <Eyebrow className="mb-4">Error 404</Eyebrow>
        <h1 className="type-display text-charcoal">This bloom has wilted</h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-stone-dark">
          The page you are looking for has moved or no longer exists. Let us help you find something fresh instead.
        </p>
        <div className="mt-10">
          <Button href="/products" size="lg">
            Shop all flowers
          </Button>
        </div>
      </Container>
    </main>
  );
}

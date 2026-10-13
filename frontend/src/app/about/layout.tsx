import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet Fresh Petals India, a family-run Delhi NCR florist making bouquets, arrangements and corporate flowers to order.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About Us", description: "Meet Fresh Petals India, a family-run Delhi NCR florist making bouquets, arrangements and corporate flowers to order.", url: "/about", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Status",
  description: "Delivery status for your Fresh Petals India order.",
  alternates: { canonical: "/track-order/results" },
  openGraph: { title: "Order Status", description: "Delivery status for your Fresh Petals India order.", url: "/track-order/results", type: "website" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

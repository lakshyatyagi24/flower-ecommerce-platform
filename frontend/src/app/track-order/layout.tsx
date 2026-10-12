import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the delivery status of your Fresh Petals India order using your order number and email.",
  alternates: { canonical: "/track-order" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

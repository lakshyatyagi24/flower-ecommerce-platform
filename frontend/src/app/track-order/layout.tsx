import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the delivery status of your Fresh Petals India order using your order number and email.",
  alternates: { canonical: "/track-order" },
  openGraph: { siteName: "Fresh Petals India", locale: "en_IN", title: "Track Your Order", description: "Check the delivery status of your Fresh Petals India order using your order number and email.", url: "/track-order", type: "website" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

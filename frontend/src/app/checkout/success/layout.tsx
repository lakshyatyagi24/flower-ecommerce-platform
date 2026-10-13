import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Confirmation and payment status for your Fresh Petals India order.",
  alternates: { canonical: "/checkout/success" },
  openGraph: { siteName: "Fresh Petals India", locale: "en_IN", title: "Order Confirmation", description: "Confirmation and payment status for your Fresh Petals India order.", url: "/checkout/success", type: "website" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout for your Fresh Petals India order.",
  alternates: { canonical: "/checkout" },
  openGraph: { siteName: "Fresh Petals India", locale: "en_IN", title: "Checkout", description: "Secure checkout for your Fresh Petals India order.", url: "/checkout", type: "website" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

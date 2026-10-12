import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Your Fresh Petals India order history and delivery status.",
  alternates: { canonical: "/account/orders" },
  openGraph: { title: "My Orders", description: "Your Fresh Petals India order history and delivery status.", url: "/account/orders", type: "website" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

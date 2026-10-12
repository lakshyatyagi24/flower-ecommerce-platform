import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund and replacement terms for perishable flowers from Fresh Petals India, including what to do if an order arrives damaged.",
  alternates: { canonical: "/refund-policy" },
  openGraph: { title: "Refund Policy", description: "Refund and replacement terms for perishable flowers from Fresh Petals India, including what to do if an order arrives damaged.", url: "/refund-policy", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

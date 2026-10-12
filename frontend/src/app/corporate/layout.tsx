import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate & Bulk Flowers",
  description: "Bulk flowers, office arrangements and event florals for businesses. Request a custom quote from Fresh Petals India.",
  alternates: { canonical: "/corporate" },
  openGraph: { title: "Corporate & Bulk Flowers", description: "Bulk flowers, office arrangements and event florals for businesses. Request a custom quote from Fresh Petals India.", url: "/corporate", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

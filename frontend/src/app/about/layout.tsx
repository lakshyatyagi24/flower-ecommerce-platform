import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet Fresh Petals India: farm-fresh cut flowers sourced from the mandi every morning and delivered with care across Delhi NCR.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About Us", description: "Meet Fresh Petals India: farm-fresh cut flowers sourced from the mandi every morning and delivered with care across Delhi NCR.", url: "/about", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

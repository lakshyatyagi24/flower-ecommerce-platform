import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Fresh Petals India for order help, delivery questions, event bookings and bulk or corporate flower enquiries.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact Us", description: "Contact Fresh Petals India for order help, delivery questions, event bookings and bulk or corporate flower enquiries.", url: "/contact", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
